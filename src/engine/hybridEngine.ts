import { Suggestion, DocumentMetrics, EngineTelemetry, WritingGoals, DEFAULT_GOALS } from '../types';
import { splitSentences, SentenceNode } from './sentence';
import { checkSpelling, loadUserDictionary } from './spell';
import { checkGrammar } from './grammar';
import { globalSentenceCache } from './cache';
import { modelManager } from './localModel';
import { analyzeTone } from './toneDetector';
import { loadStyleGuide, checkStyleGuide } from './styleGuide';

// Initialize user dictionary on startup
loadUserDictionary();

// Syllable counter for Flesch-Kincaid
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
  const paragraphCount = text.trim() === '' ? 0 : text.trim().split(/\n\s*\n/).filter(p => p.trim().length > 0).length || 1;
  const sentenceCount = Math.max(1, sentences.length);

  // Readability calculation
  let totalSyllables = 0;
  for (const w of words) {
    totalSyllables += countSyllables(w);
  }

  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = wordCount > 0 ? totalSyllables / wordCount : 1;

  // Flesch Reading Ease: 206.835 - (1.015 * ASL) - (84.6 * ASW)
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

  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));
  const avgWordsPerSentence = sentenceCount > 0 ? parseFloat((wordCount / sentenceCount).toFixed(1)) : 0;
  const longestSentenceWords = sentences.reduce((max, s) => {
    const wc = s.text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(max, wc);
  }, 0);

  return {
    wordCount,
    charCount,
    charCountNoSpaces,
    paragraphCount,
    sentenceCount,
    readingTimeMin,
    readabilityScore: readingEase,
    gradeLevel,
    clarityScore: Math.max(60, Math.min(100, 100 - Math.round(wordsPerSentence * 0.8))),
    avgWordsPerSentence,
    longestSentenceWords,
  };
}

export interface AnalysisResult {
  suggestions: Suggestion[];
  metrics: DocumentMetrics;
  telemetry: EngineTelemetry;
}

/**
 * Top-level Hybrid Engine orchestrating Tiers 0-3 (<50ms target)
 */
export function analyzeDocument(documentText: string, goals: WritingGoals = DEFAULT_GOALS): AnalysisResult {
  const startTime = performance.now();

  // Step 1: Tokenize & Sentence Split (<0.5ms)
  const t0 = performance.now();
  const sentences = splitSentences(documentText);
  const tokenizerMs = parseFloat((performance.now() - t0).toFixed(2));

  const allSuggestions: Suggestion[] = [];
  let allCacheHits = sentences.length > 0;

  // Step 2: Sentence-by-sentence check with hash cache
  for (const s of sentences) {
    const cached = globalSentenceCache.get(s.text);

    if (cached) {
      // Fast cache hit: adjust offsets if sentence position shifted
      const offsetDiff = s.start;
      for (const item of cached) {
        allSuggestions.push({
          ...item,
          start: item.start,
          end: item.end,
          sentenceIndex: s.index,
        });
      }
    } else {
      allCacheHits = false;

      // Tier 1: SymSpell Spell Check (<2ms)
      const spellSuggestions = checkSpelling(s.text, s.start, s.index);

      // Tier 2: Non-autoregressive Grammar Tagger (<15ms) — goals-aware
      const grammarSuggestions = checkGrammar(s.text, s.start, s.index, goals);

      // Tier 2b: Style Guide (brand terms) — offline, local JSON
      const styleGuideRules = loadStyleGuide();
      const styleHits = checkStyleGuide(s.text, styleGuideRules).map(h => ({
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

      // Combine suggestions for this sentence
      const sentenceSuggestions = [...spellSuggestions, ...grammarSuggestions, ...styleHits];

      // Cache this sentence
      globalSentenceCache.set(s.text, sentenceSuggestions);

      allSuggestions.push(...sentenceSuggestions);
    }
  }

  // Deduplicate and sort by character position
  const seenRanges = new Set<string>();
  const uniqueSuggestions: Suggestion[] = [];

  for (const s of allSuggestions) {
    const key = `${s.start}-${s.end}`;
    if (!seenRanges.has(key)) {
      seenRanges.add(key);
      uniqueSuggestions.push(s);
    }
  }

  uniqueSuggestions.sort((a, b) => a.start - b.start);

  const metrics = computeDocumentMetrics(documentText, sentences);
  const totalMs = parseFloat((performance.now() - startTime).toFixed(2));
  const engineMs = parseFloat((totalMs - tokenizerMs).toFixed(2));

  const tone = analyzeTone(documentText);

  const telemetry: EngineTelemetry = {
    lastLatencyMs: totalMs,
    tokenizerMs,
    engineMs,
    cacheHit: allCacheHits,
    activeModel: modelManager.getActiveRealtimeModel().name,
    timestamp: Date.now(),
    tone,
  };

  return {
    suggestions: uniqueSuggestions,
    metrics,
    telemetry,
  };
}
