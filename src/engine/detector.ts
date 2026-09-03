export interface DetectorResult {
  aiLikelihood: number; // 0-100
  label: 'likely human' | 'possibly AI' | 'likely AI';
  signals: string[];
  humanizeSuggestion?: string;
}

// Heuristic offline detector: burstiness + perplexity proxy + AI tells
const AI_TELLS = ['delve', 'tapestry', 'in the realm of', 'it is important to note', 'as an ai', 'moreover', 'furthermore', 'in conclusion', 'overall', 'additionally', 'ultimately'];
const REPETITIVE_PHRASES = ['in order to', 'due to the fact that', 'at this point in time'];

export function detectAI(text: string): DetectorResult {
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 30) {
    return { aiLikelihood: 10, label: 'likely human', signals: ['Text too short for reliable detection'] };
  }
  let score = 0;
  const signals: string[] = [];

  // Signal 1: AI buzzwords
  const tellCount = AI_TELLS.filter(t => lower.includes(t)).length;
  if (tellCount > 0) { score += tellCount * 18; signals.push(`${tellCount} AI-typical phrase${tellCount > 1 ? 's' : ''} detected`); }

  // Signal 2: Low burstiness (uniform sentence length = AI-like)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().split(/\s+/).length > 3);
  if (sentences.length >= 4) {
    const lens = sentences.map(s => s.trim().split(/\s+/).length);
    const avg = lens.reduce((a, b) => a + b, 0) / lens.length;
    const variance = lens.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / lens.length;
    const burstiness = Math.sqrt(variance) / avg;
    if (burstiness < 0.35) { score += 22; signals.push('Low sentence burstiness — AI tends toward uniform length'); }
    else if (burstiness > 0.7) { signals.push('Natural burstiness'); }
  }

  // Signal 3: Repetitive filler
  const fillerCount = REPETITIVE_PHRASES.filter(p => lower.includes(p)).length;
  if (fillerCount > 0) { score += fillerCount * 10; signals.push('Verbose filler phrases'); }

  // Signal 4: Over-formal uniformity (no contractions, no first-person)
  const hasContraction = /n't|'re|'ve|'ll/.test(lower);
  const hasFirstPerson = /\b(i|we|my|our)\b/.test(lower);
  if (!hasContraction && !hasFirstPerson && words.length > 80) { score += 15; signals.push('No contractions or first-person — overly formal'); }

  // Signal 5: Lexical diversity proxy (type-token ratio)
  const unique = new Set(words.map(w => w.toLowerCase())).size;
  const ttr = unique / words.length;
  if (ttr < 0.45) { score += 14; signals.push('Low lexical diversity'); }
  if (ttr > 0.65) signals.push('High lexical diversity — human-like');

  const aiLikelihood = Math.max(0, Math.min(95, Math.round(score)));
  let label: DetectorResult['label'] = 'likely human';
  if (aiLikelihood >= 65) label = 'likely AI';
  else if (aiLikelihood >= 35) label = 'possibly AI';

  const humanizeSuggestion = aiLikelihood >= 35 ? 'Try Tone → Casual or add personal anecdotes/contractions to increase burstiness.' : undefined;

  return { aiLikelihood, label, signals: signals.length ? signals : ['No strong AI signals — reads human'], humanizeSuggestion };
}

export function humanizeText(text: string): string {
  // Simple rule-based humanizer: inject burstiness via sentence splits + contractions
  let out = text
    .replace(/\bdo not\b/gi, "don't")
    .replace(/\bcannot\b/gi, "can't")
    .replace(/\bIt is important to note that\b/gi, '')
    .replace(/\bMoreover,?\b/gi, '')
    .replace(/\bFurthermore,?\b/gi, '')
    .replace(/\bIn conclusion,?\b/gi, '')
    .replace(/\. ([A-Z][^.!?]{40,80})\./g, '. $1 — you know? .');
  return out.trim().replace(/\s{2,}/g, ' ');
}
