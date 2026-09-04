import { generateText } from "ai";
import { getAIModel } from "./ai/providers";
import { getWriteEngineSelection } from "../proofread/providerCatalog";
import { rewriteText } from "../proofread/rewriter";
import { correctText as offlineCorrect } from "./ProofreadService";
import type { ToneStyle } from "../proofread/proofreadTypes";

const KEY_GETTERS: Record<string, () => Promise<string | null | undefined>> = {
  openai: () => window.electronAPI?.getOpenAIKey?.(),
  anthropic: () => window.electronAPI?.getAnthropicKey?.(),
  gemini: () => window.electronAPI?.getGeminiKey?.(),
  groq: () => window.electronAPI?.getGroqKey?.(),
  openrouter: () => window.electronAPI?.getOpenrouterKey?.(),
  deepseek: () => window.electronAPI?.getDeepseekKey?.(),
  fireworks: () => window.electronAPI?.getFireworksKey?.(),
  together: () => window.electronAPI?.getTogetherKey?.(),
  minimax: () => window.electronAPI?.getMinimaxKey?.(),
  mistral: () => window.electronAPI?.getMistralKey?.(),
  perplexity: () => window.electronAPI?.getPerplexityKey?.(),
  cohere: () => window.electronAPI?.getCohereKey?.(),
  xai: () => window.electronAPI?.getXaiKey?.(),
};

async function getWriteModel() {
  const sel = getWriteEngineSelection();
  const key = (await KEY_GETTERS[sel.provider]?.())?.trim() || "";
  if (!key) throw new Error(`No API key saved for ${sel.provider} — add one in Settings → Providers.`);
  return { model: await getAIModel(sel.provider, sel.model, key), label: `${sel.provider}/${sel.model}` };
}

async function runPrompt(system: string, user: string): Promise<{ text: string; providerUsed: string }> {
  const { model, label } = await getWriteModel();
  const { text } = await generateText({ model, system, prompt: user, temperature: 0.3, maxOutputTokens: 2048 });
  return { text: text.trim(), providerUsed: label };
}

export async function rewriteWithTone(
  text: string,
  tone: ToneStyle,
  instruction?: string
): Promise<{ rewritten: string; providerUsed: string }> {
  let system = `You are Writely, an elite writing assistant. Rewrite the user's text in a ${tone.toUpperCase()} tone. Return only the rewritten text without markdown fences, preamble, or conversational filler.`;
  if (instruction?.trim()) system += ` Additional user instruction (follow it while rewriting): ${instruction.trim()}`;
  try {
    const r = await runPrompt(system, text);
    return { rewritten: r.text || text, providerUsed: r.providerUsed };
  } catch {
    // Offline fallback: local rule-based rewrite
    const local = await rewriteText(text, tone);
    return { rewritten: local.rewritten || text, providerUsed: "Writely offline rewrite" };
  }
}

export async function translateWriting(
  text: string,
  targetLang: string
): Promise<{ translated: string; providerUsed: string }> {
  const system = `You are a professional translator. Translate the user's text to ${targetLang}. Return ONLY the translated text — no explanations, no markdown fences, no preamble. Preserve tone and formatting.`;
  const r = await runPrompt(system, text);
  if (!r.text) throw new Error("Translation returned empty — check provider key/model.");
  return { translated: r.text, providerUsed: r.providerUsed };
}

export async function correctWriting(
  text: string
): Promise<{ corrected: string; count: number; providerUsed: string }> {
  const system = `Correct grammar, spelling, and punctuation in the following text. Return ONLY the corrected text, no explanation, no markdown.`;
  try {
    const r = await runPrompt(system, text);
    if (r.text && r.text !== text) return { corrected: r.text, count: 1, providerUsed: r.providerUsed };
  } catch {}
  return offlineCorrect(text);
}

export const WritingAssistService = {
  rewrite: rewriteWithTone,
  translate: translateWriting,
  correct: correctWriting,
};
