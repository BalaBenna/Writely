import {
  analyzeDocument,
  applyAllSuggestions,
  type ProofreadResult,
} from "../proofread/proofreadEngine";
import type { Suggestion, WritingGoals } from "../proofread/proofreadTypes";
import { DEFAULT_GOALS } from "../proofread/proofreadTypes";

export type { Suggestion, ProofreadResult };

/**
 * ProofreadService — Writely's offline proofreading engine surfaced with a
 * plain function API matching this codebase's services style.
 */
export async function proofreadText(
  text: string,
  goals: WritingGoals = DEFAULT_GOALS
): Promise<ProofreadResult> {
  return analyzeDocument(text, goals);
}

export async function correctText(
  text: string,
  goals: WritingGoals = DEFAULT_GOALS
): Promise<{ corrected: string; count: number; providerUsed: string }> {
  const result = analyzeDocument(text, goals);
  return {
    corrected: applyAllSuggestions(text, result.suggestions),
    count: result.suggestions.length,
    providerUsed: "Writely proofread engine (offline)",
  };
}

export async function applySuggestion(
  text: string,
  suggestion: Suggestion
): Promise<string> {
  return applyAllSuggestions(text, [suggestion]);
}
