import {
  Suggestion,
  DocumentMetrics,
  EngineTelemetry,
  WritingGoals,
  DEFAULT_GOALS,
} from './proofreadTypes';
import { splitSentences, SentenceNode } from './sentence';
import { checkSpelling, loadUserDictionary } from './spell';
import { checkGrammar } from './grammar';
import { globalSentenceCache } from './cache';
import { analyzeTone } from './toneDetector';
import { loadStyleGuide, checkStyleGuide } from './styleGuide';

loadUserDictionary();

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]|ed|es|e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

export function computeDocumentMetrics(text: string, sentences: SentenceNode[]): DocumentMetrics {
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;
  const charCount = text.length;
  const charCountNoSpaces = text.replace(/\s/g, '').length;
  const paragraphCount = text.trim() === '' ? 0 : text.trim().split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || 1;
  const sentenceCount = Math.max(1, sentences.length);

  let totalSyllables = 0;
  for (const w of words) totalSyllables += countSyllables(w);

  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = wordCount > 0 ? totalSyllables / wordCount : 1;
  let readingEase = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
  readingEase = Math.max(0, Math.min(100, Math.round(readingEase)));

  let gradeLevel = 'Standard';
  if (readingEase >= 90) gradeLevel = '5th Grade (Very Easy)';
  else if (readingEase >= 80) gradeLevel = '6th Grade (Easy)';
  else if (readingEase >= 70) gradeLevel = '7th Grade (Fairly Easy)';
  else if (readingEase >= 60) gradeLevel = '8th-9th Grade (Standard)';
  else if (readingEase >= 50) gradeLevel = '10th-12th Grade (Fairly Difficult)';
  else if (readingEase >= 30) gradeLevel = 'College Level (Difficult)';
  else gradeLevel = 'Graduate / Academic (Very Difficult)';

  return {
    wordCount,
    charCount,
    charCountNoSpaces,
    paragraphCount,
    sentenceCount,
    readingTimeMin: Math.max(1, Math.ceil(wordCount / 200)),
    readabilityScore: readingEase,
    gradeLevel,
    clarityScore: Math.max(60, Math.min(100, 100 - Math.round(wordsPerSentence * 0.8))),
    avgWordsPerSentence: sentenceCount > 0 ? parseFloat((wordCount / sentenceCount).toFixed(1)) : 0,
    longestSentenceWords: sentences.reduce((max, s) => {
      const wc = s.text.trim().split(/\s+/).filter(Boolean).length;
      return Math.max(max, wc);
    }, 0),
  };
}

export interface ProofreadResult {
  suggestions: Suggestion[];
  metrics: DocumentMetrics;
  telemetry: EngineTelemetry;
}

/**
 * Writely proofreading pipeline (ported): sentence split + hash cache,
 * SymSpell spelling, pattern grammar tagger, style guide — all offline.
 */
export function analyzeDocument(documentText: string, goals: WritingGoals = DEFAULT_GOALS): ProofreadResult {
  const startTime = performance.now();
  const t0 = performance.now();
  const sentences = splitSentences(documentText);
  const tokenizerMs = parseFloat((performance.now() - t0).toFixed(2));

  const allSuggestions: Suggestion[] = [];
  let allCacheHits = sentences.length > 0;

  for (const s of sentences) {
    const cached = globalSentenceCache.get(s.text);
    if (cached) {
      for (const item of cached) {
        allSuggestions.push({ ...item, start: item.start + s.start, end: item.end + s.start, sentenceIndex: s.index });
      }
    } else {
      allCacheHits = false;
      const spellSuggestions = checkSpelling(s.text, s.start, s.index);
      const grammarSuggestions = checkGrammar(s.text, s.start, s.index, goals);
      const styleGuideRules = loadStyleGuide();
      const styleHits = checkStyleGuide(s.text, styleGuideRules).map((h) => ({
        id: `style-${s.start + h.start}-${s.start + h.end}`,
        type: 'tone' as const,
        original: s.text.slice(h.start, h.end),
        replacement: h.suggestion,
        explanation: `Style guide: prefer "${h.suggestion}" over "${h.term}"`,
        start: s.start + h.start,
        end: s.start + h.end,
        sentenceIndex: s.index,
        ruleId: `STYLE_${h.term}`,
        confidence: 0.92,
      }));
      const sentenceSuggestions = [...spellSuggestions, ...grammarSuggestions, ...styleHits];
      globalSentenceCache.set(
        s.text,
        sentenceSuggestions.map((sug) => ({ ...sug, start: sug.start - s.start, end: sug.end - s.start }))
      );
      allSuggestions.push(...sentenceSuggestions);
    }
  }

  const seenRanges = new Set<string>();
  const uniqueSuggestions = allSuggestions
    .filter((s) => {
      const key = `${s.start}-${s.end}`;
      if (seenRanges.has(key)) return false;
      seenRanges.add(key);
      return true;
    })
    .sort((a, b) => a.start - b.start);

  const metrics = computeDocumentMetrics(documentText, sentences);
  const totalMs = parseFloat((performance.now() - startTime).toFixed(2));
  const telemetry: EngineTelemetry = {
    lastLatencyMs: totalMs,
    tokenizerMs,
    engineMs: parseFloat((totalMs - tokenizerMs).toFixed(2)),
    cacheHit: allCacheHits,
    activeModel: 'Writely proofread engine (offline)',
    timestamp: Date.now(),
    tone: analyzeTone(documentText),
  };
  return { suggestions: uniqueSuggestions, metrics, telemetry };
}

/** Apply every suggestion right-to-left; returns corrected text. */
export function applyAllSuggestions(input: string, suggestions: Suggestion[]): string {
  const sorted = [...suggestions].sort((a, b) => b.start - a.start);
  let corrected = input;
  for (const s of sorted) {
    if (corrected.substring(s.start, s.end) === s.original) {
      corrected = corrected.substring(0, s.start) + s.replacement + corrected.substring(s.end);
    } else {
      const idx = corrected.indexOf(s.original);
      if (idx !== -1) corrected = corrected.substring(0, idx) + s.replacement + corrected.substring(idx + s.original.length);
    }
  }
  return corrected;
}
