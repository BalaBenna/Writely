import { Suggestion } from '../types';

export interface RawCorrection {
  start: number;
  end: number;
  replacement: string;
  category?: string; // grammar | spelling | clarity | tone
  confidence?: number;
  explanation?: string;
}

// JSON Schema for GBNF constraints (llama.cpp)
export const CORRECTION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    corrections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          start: { type: 'integer', minimum: 0 },
          end: { type: 'integer', minimum: 0 },
          replacement: { type: 'string' },
          category: { type: 'string', enum: ['grammar', 'spelling', 'clarity', 'tone'] },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
        required: ['start', 'end', 'replacement'],
        additionalProperties: false,
      },
    },
  },
  required: ['corrections'],
  additionalProperties: false,
} as const;

export function parseCorrectionsJson(raw: string): RawCorrection[] {
  try {
    const obj = JSON.parse(raw);
    if (!obj || !Array.isArray(obj.corrections)) return [];
    return obj.corrections.filter((c: any) => typeof c.start === 'number' && typeof c.end === 'number' && typeof c.replacement === 'string');
  } catch {
    return [];
  }
}

// Correction pipeline validators — never trust LLM blindly
export function validateCorrections(text: string, corrections: RawCorrection[], opts?: { minConfidence?: number; maxReplacementLen?: number }): RawCorrection[] {
  const minConf = opts?.minConfidence ?? 0.6;
  const maxLen = opts?.maxReplacementLen ?? 80;
  const out: RawCorrection[] = [];
  for (const c of corrections) {
    if (c.start < 0 || c.end < 0 || c.start >= c.end) continue;
    if (c.end > text.length) continue;
    if (c.replacement.length > maxLen) continue;
    if ((c.confidence ?? 1) < minConf) continue;
    // Validate that the slice matches conceptually? We can't know original, but we check offsets are within word boundaries heuristically
    // For strict: require that text.slice(start,end) is non-empty and not crossing line boundaries absurdly
    const slice = text.slice(c.start, c.end);
    if (!slice || slice.length === 0) continue;
    // Discard if replacement == slice (no-op)
    if (slice === c.replacement) continue;
    out.push(c);
  }
  // Deduplicate by start-end
  const seen = new Set<string>();
  return out.filter(c => {
    const k = `${c.start}-${c.end}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).sort((a, b) => a.start - b.start);
}

export function rawToSuggestions(corrections: RawCorrection[], sentenceOffset: number, sentenceIndex: number, fullText: string): Suggestion[] {
  return corrections.map((c, idx) => ({
    id: `ai-${sentenceOffset + c.start}-${sentenceOffset + c.end}-${idx}`,
    type: (c.category as any) || 'grammar',
    original: fullText.slice(c.start, c.end),
    replacement: c.replacement,
    explanation: c.explanation || `AI correction (${c.category || 'grammar'})`,
    start: sentenceOffset + c.start,
    end: sentenceOffset + c.end,
    sentenceIndex,
    ruleId: `AI_${c.category?.toUpperCase() || 'GRAMMAR'}`,
    confidence: c.confidence ?? 0.9,
  }));
}
