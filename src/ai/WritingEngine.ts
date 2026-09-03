// WritingEngine — umbrella abstraction per spec §26, not "LLM"
// Composes SpellChecker + RuleEngine + QwenGrammarModel + RewriteModel + DiffEngine + PersonalDictionary

import { Suggestion } from '../types';
import { checkSpelling } from '../engine/spell';
import { checkGrammar } from '../engine/grammar';
import { aiManager } from './AIManager';
import { validateCorrections } from './CorrectionParser';

export interface WritingEngineOpts {
  useAI?: boolean;
  aiTier?: 'fast' | 'balanced';
  before?: string;
  after?: string;
  goals?: import('../types').WritingGoals;
}

export class WritingEngine {
  // Three-layer pipeline: debounce → sentence → RuleEngine → Small LLM → Validate → UI
  async analyzeSentence(sentenceText: string, sentenceOffset: number, sentenceIndex: number, opts: WritingEngineOpts = {}): Promise<Suggestion[]> {
    const goals = opts.goals;
    // Layer 1 — deterministic rule engine (almost free)
    const spell = checkSpelling(sentenceText, sentenceOffset, sentenceIndex);
    const grammar = checkGrammar(sentenceText, sentenceOffset, sentenceIndex, goals as any);

    // Fast path: if obvious mistakes already found and no AI requested, return them
    if (!opts.useAI) {
      return [...spell, ...grammar];
    }

    // Layer 2 — fast AI (3B/4B) for grammar beyond rules
    try {
      const aiSuggestions = await aiManager.correctGrammar(sentenceText, {
        before: opts.before,
        after: opts.after,
        tier: opts.aiTier ?? 'fast',
        sentenceOffset,
        sentenceIndex,
      });
      // Validate again (AI output not trusted blindly)
      const validated = aiSuggestions.filter(s => {
        // offset sanity already done in CorrectionParser, plus confidence threshold
        if ((s.confidence ?? 1) < 0.6) return false;
        if (s.replacement.length > 80) return false;
        return true;
      });
      // Merge rule + AI, dedupe by start-end
      const all = [...spell, ...grammar, ...validated];
      const seen = new Set<string>();
      const deduped: Suggestion[] = [];
      for (const s of all) {
        const k = `${s.start}-${s.end}`;
        if (!seen.has(k)) { seen.add(k); deduped.push(s); }
      }
      return deduped.sort((a, b) => a.start - b.start);
    } catch {
      // AI unavailable — fall back to rule engine
      return [...spell, ...grammar];
    }
  }

  async rewrite(text: string, style: string, tier: 'balanced' | 'quality' = 'balanced'): Promise<string> {
    return aiManager.rewrite(text, style, { tier });
  }
}

export const writingEngine = new WritingEngine();
