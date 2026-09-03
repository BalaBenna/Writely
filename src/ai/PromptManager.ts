// PromptManager — Grammarly-style patch prompts with context window

export const GRAMMAR_SYSTEM_PROMPT = `You are a local grammar correction engine.

Your job is to identify genuine writing errors.

Rules:
1. Do not rewrite correct sentences.
2. Do not change the author's meaning.
3. Do not change personal style unnecessarily.
4. Do not make stylistic suggestions unless requested.
5. Return only corrections.
6. Every correction must contain exact character offsets (UTF-16 code units, same as JavaScript String).
7. Preserve capitalization unless it is incorrect.
8. Preserve punctuation unless it is incorrect.
9. Prefer minimal corrections.
10. Confidence must represent how certain the correction is (0.0-1.0).

Return JSON matching the provided schema.`;

export interface PromptContext {
  target: string;
  before?: string; // previous sentence
  after?: string; // next sentence
}

export function buildGrammarPrompt(ctx: PromptContext): string {
  const parts: string[] = [];
  if (ctx.before) parts.push(`CONTEXT BEFORE:\n${ctx.before}`);
  parts.push(`TARGET:\n${ctx.target}`);
  if (ctx.after) parts.push(`CONTEXT AFTER:\n${ctx.after}`);
  parts.push(`\nReturn corrections for TARGET only.`);
  return parts.join('\n\n');
}

export const REWRITE_PROMPTS: Record<string, string> = {
  professional: 'Rewrite to sound professional and concise, preserving meaning.',
  friendly: 'Rewrite to sound friendly and warm.',
  concise: 'Rewrite to be concise — remove filler, keep meaning.',
  academic: 'Rewrite in academic tone, formal, precise.',
  casual: 'Rewrite in casual, conversational tone.',
};

export function buildRewritePrompt(text: string, style: string, instruction?: string): string {
  const styleInstr = REWRITE_PROMPTS[style] || instruction || 'Improve clarity and correctness.';
  return `${styleInstr}\n\nTEXT:\n${text}`;
}
