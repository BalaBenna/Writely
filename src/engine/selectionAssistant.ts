import { analyzeDocument } from './hybridEngine';
import { rewriteText } from './rewriter';
import { cloudManager } from './cloudProviders';
import { ToneStyle } from '../types';

export type AssistantTab = 'improve' | 'rephrase' | 'translate' | 'shorten' | 'friendly' | 'formal';

export const ASSISTANT_TABS: Array<{ id: AssistantTab; label: string }> = [
  { id: 'improve', label: 'Improve' },
  { id: 'rephrase', label: 'Rephrase' },
  { id: 'translate', label: 'Translate' },
  { id: 'shorten', label: 'Shorten' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'formal', label: 'Formal' },
];

export const TRANSLATE_LANGUAGES = [
  'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch',
  'Russian', 'Chinese (Simplified)', 'Japanese', 'Korean', 'Hindi',
  'Arabic', 'Turkish', 'Polish', 'Swedish', 'Indonesian',
  'Vietnamese', 'Thai', 'Hebrew', 'Greek',
];

export function getSavedTranslateLang(): string {
  try {
    return localStorage.getItem('writely_translate_lang') || 'Spanish';
  } catch {
    return 'Spanish';
  }
}

export function saveTranslateLang(lang: string) {
  try {
    localStorage.setItem('writely_translate_lang', lang);
  } catch (_) {}
}

export interface AssistantResult {
  tab: AssistantTab;
  title: string;
  original: string;
  corrected: string;
  latencyMs: number;
  providerUsed?: string;
  count: number;
  highlights: string[];
  needsProvider?: boolean;
}

const TAB_TONE: Record<string, ToneStyle> = {
  rephrase: 'professional',
  shorten: 'concise',
  friendly: 'friendly',
  formal: 'academic',
};

const TAB_TITLE: Record<string, string> = {
  rephrase: 'Rephrased for impact',
  shorten: 'Shortened for conciseness',
  friendly: 'Warmed up - friendly tone',
  formal: 'Formalized tone',
};

async function translateWithLocalRunner(text: string, targetLang: string): Promise<{ translated: string; providerUsed: string }> {
  const empty = { translated: '', providerUsed: '' };

  try {
    const tags = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(2500) }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const names: string[] = ((tags && tags.models) || []).map((m: any) => m.name || m.model).filter(Boolean);
    if (names.length > 0) {
      const pick = names.find((n) => /instruct|chat|qwen|llama|mistral|gemma|phi/i.test(n)) || names[0];
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: pick,
          prompt: 'Translate the following text to ' + targetLang + '. Return ONLY the translated text, no explanations, no markdown fences.\n\nText:\n' + text + '\n\nTranslation:',
          stream: false,
        }),
        signal: AbortSignal.timeout(60000),
      }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      const out = ((res && res.response) || '').trim();
      if (out) return { translated: out, providerUsed: 'Ollama ' + pick + ' (on-device)' };
    }
  } catch (_) {}

  try {
    const models = await fetch('http://localhost:1234/v1/models', { signal: AbortSignal.timeout(2500) }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const id: string = (models && models.data && models.data[0] && models.data[0].id) || '';
    if (id) {
      const res = await fetch('http://localhost:1234/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: id,
          messages: [
            { role: 'system', content: 'You are a professional translator. Translate to ' + targetLang + '. Return only the translation.' },
            { role: 'user', content: text },
          ],
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(60000),
      }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      const out = ((res && res.choices && res.choices[0] && res.choices[0].message && res.choices[0].message.content) || '').trim();
      if (out) return { translated: out, providerUsed: 'LM Studio ' + id + ' (on-device)' };
    }
  } catch (_) {}

  try {
    const ce = cloudManager.getCustomEndpoint();
    if (ce && ce.enabled && ce.baseUrl) {
      const r = await cloudManager.executeCustomRewrite(text, 'professional', 'Translate the text to ' + targetLang + '. Return only the translation.');
      if (r.rewritten && r.rewritten !== text) return { translated: r.rewritten, providerUsed: r.providerUsed + ' (local endpoint)' };
    }
  } catch (_) {}

  return empty;
}

export async function translateText(text: string, targetLang: string): Promise<AssistantResult> {
  const input = String(text || '');
  const t0 = performance.now();
  const ok = (translated: string, providerUsed?: string): AssistantResult => ({
    tab: 'translate',
    title: 'Translated to ' + targetLang,
    original: input,
    corrected: translated,
    latencyMs: Math.round(performance.now() - t0),
    providerUsed,
    count: 1,
    highlights: [],
  });
  const active = cloudManager.getActiveModelId();

  if (cloudActive()) {
    try {
      const r = await cloudManager.executeTranslation(input, targetLang);
      if (r.translated) return ok(r.translated, r.providerUsed);
    } catch (_) {}
    try {
      const lr = await translateWithLocalRunner(input, targetLang);
      if (lr.translated) return ok(lr.translated, lr.providerUsed);
    } catch (_) {}
  } else if (active === 'custom' && cloudManager.getCustomEndpoint().enabled) {
    try {
      const r = await cloudManager.executeCustomRewrite(input, 'professional', 'Translate the text to ' + targetLang + '. Return only the translation.');
      if (r.rewritten && r.rewritten !== input) return ok(r.rewritten, r.providerUsed);
    } catch (_) {}
    try {
      const lr = await translateWithLocalRunner(input, targetLang);
      if (lr.translated) return ok(lr.translated, lr.providerUsed);
    } catch (_) {}
  } else {
    try {
      const lr = await translateWithLocalRunner(input, targetLang);
      if (lr.translated) return ok(lr.translated, lr.providerUsed);
    } catch (_) {}
  }

  return {
    tab: 'translate',
    title: 'Translate to ' + targetLang,
    original: input,
    corrected: input,
    latencyMs: Math.round(performance.now() - t0),
    count: 0,
    highlights: [],
    needsProvider: true,
  };
}

function applyLocalGrammar(input: string): { corrected: string; count: number; highlights: string[]; firstExplanation: string } {
  const result = analyzeDocument(input);
  const sorted = [...result.suggestions].sort((a, b) => b.start - a.start);
  let corrected = input;
  const highlights: string[] = [];
  for (const s of sorted) {
    const slice = corrected.substring(s.start, s.end);
    if (slice === s.original) {
      corrected = corrected.substring(0, s.start) + s.replacement + corrected.substring(s.end);
    } else {
      const idx = corrected.indexOf(s.original);
      if (idx !== -1) corrected = corrected.substring(0, idx) + s.replacement + corrected.substring(idx + s.original.length);
      else continue;
    }
    if (s.replacement.trim()) highlights.push(s.replacement);
  }
  return { corrected, count: result.suggestions.length, highlights, firstExplanation: (result.suggestions[0] && result.suggestions[0].explanation) || '' };
}

function cloudActive(): boolean {
  const active = cloudManager.getActiveModelId();
  return !!active && active !== 'local' && active !== 'custom';
}

function toneFromInstruction(instruction: string): ToneStyle {
  const l = instruction.toLowerCase();
  if (/short|concis|brief|tighten|crisp|trim/.test(l)) return 'concise';
  if (/friend|warm|polite|kind|welcom/.test(l)) return 'friendly';
  if (/academic|scholar|technical|formal|thesis/.test(l)) return 'academic';
  if (/casual|relax|simple|informal|chatty/.test(l)) return 'casual';
  return 'professional';
}

export async function reviseWithInstruction(text: string, instruction: string): Promise<AssistantResult> {
  const input = String(text || '');
  const t0 = performance.now();
  const done = (corrected: string, providerUsed?: string): AssistantResult => ({
    tab: 'rephrase',
    title: 'Revised with AI',
    original: input,
    corrected,
    latencyMs: Math.round(performance.now() - t0),
    providerUsed,
    count: 1,
    highlights: [],
  });

  if (cloudActive()) {
    try {
      const r = await cloudManager.executeCloudRewrite(input, 'professional', cloudManager.getActiveModelId(), instruction);
      if (r.rewritten) return done(r.rewritten, r.providerUsed);
    } catch (_) {}
  }
  if (cloudManager.getActiveModelId() === 'custom' && cloudManager.getCustomEndpoint().enabled) {
    try {
      const r = await cloudManager.executeCustomRewrite(input, 'professional', instruction);
      if (r.rewritten) return done(r.rewritten, r.providerUsed);
    } catch (_) {}
  }
  const r = await rewriteText(input, toneFromInstruction(instruction));
  return done(r.rewritten || input);
}

export async function runAssistantTab(text: string, tab: AssistantTab, targetLang?: string): Promise<AssistantResult> {
  if (tab === 'translate') {
    return translateText(text, targetLang || getSavedTranslateLang());
  }
  const input = String(text || '');
  const t0 = performance.now();
  const done = (partial: Omit<AssistantResult, 'tab' | 'original' | 'latencyMs'>): AssistantResult => ({
    tab,
    original: input,
    latencyMs: Math.round(performance.now() - t0),
    ...partial,
  });

  if (tab === 'improve') {
    if (cloudActive()) {
      try {
        const g = await cloudManager.executeCloudGrammar(input, cloudManager.getActiveModelId());
        if (g.corrected && g.corrected !== input) {
          return done({ title: 'Polished with ' + g.providerUsed, corrected: g.corrected, providerUsed: g.providerUsed, count: 1, highlights: [] });
        }
      } catch (_) {}
    }
    if (cloudManager.getActiveModelId() === 'custom' && cloudManager.getCustomEndpoint().enabled) {
      try {
        const r = await cloudManager.executeCustomRewrite(input, 'professional');
        if (r.rewritten && r.rewritten !== input) {
          return done({ title: 'Polished via ' + r.providerUsed, corrected: r.rewritten, providerUsed: r.providerUsed, count: 1, highlights: [] });
        }
      } catch (_) {}
    }
    const local = applyLocalGrammar(input);
    const title =
      local.count === 0
        ? 'No issues found'
        : local.count === 1 && local.firstExplanation
        ? local.firstExplanation.slice(0, 90)
        : local.count + ' writing improvements';
    return done({ title, corrected: local.corrected, count: local.count, highlights: local.highlights.slice(0, 12) });
  }

  const tone = TAB_TONE[tab];
  if (cloudActive()) {
    try {
      const r = await cloudManager.executeCloudRewrite(input, tone, cloudManager.getActiveModelId());
      if (r.rewritten && r.rewritten !== input) {
        return done({ title: TAB_TITLE[tab], corrected: r.rewritten, providerUsed: r.providerUsed, count: 1, highlights: [] });
      }
    } catch (_) {}
  }
  if (cloudManager.getActiveModelId() === 'custom' && cloudManager.getCustomEndpoint().enabled) {
    try {
      const r = await cloudManager.executeCustomRewrite(input, tone);
      if (r.rewritten && r.rewritten !== input) {
        return done({ title: TAB_TITLE[tab], corrected: r.rewritten, providerUsed: r.providerUsed, count: 1, highlights: [] });
      }
    } catch (_) {}
  }
  const r = await rewriteText(input, tone);
  return done({ title: TAB_TITLE[tab], corrected: r.rewritten || input, count: 1, highlights: [] });
}
