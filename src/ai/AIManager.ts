// AIManager — model-independent orchestrator per spec §2
// Renderer never cares if it's Qwen3 8B, Mistral, Gemma, etc.

import { InferenceEngine } from './InferenceEngine';
import { GRAMMAR_SYSTEM_PROMPT, buildGrammarPrompt, buildRewritePrompt } from './PromptManager';
import { CORRECTION_JSON_SCHEMA, parseCorrectionsJson, validateCorrections, rawToSuggestions } from './CorrectionParser';
import { Suggestion } from '../types';

export interface LocalModel {
  id: string;
  name: string;
  version: string;
  tier: 'fast' | 'balanced' | 'quality';
  engine: InferenceEngine;
  load(): Promise<void>;
  unload(): Promise<void>;
  generate(req: { prompt: string; jsonSchema?: object; signal?: AbortSignal }): Promise<{ text: string; latencyMs: number }>;
}

class LocalModelImpl implements LocalModel {
  id: string;
  name: string;
  version: string;
  tier: 'fast' | 'balanced' | 'quality';
  engine: InferenceEngine;
  constructor(id: string, name: string, version: string, tier: 'fast' | 'balanced' | 'quality', engine: InferenceEngine) {
    this.id = id; this.name = name; this.version = version; this.tier = tier; this.engine = engine;
  }
  async load() { /* spawn handled by Electron Main UtilityProcess */ }
  async unload() {}
  async generate(req: { prompt: string; jsonSchema?: object; signal?: AbortSignal }) {
    return this.engine.generate({ prompt: req.prompt, jsonSchema: req.jsonSchema, signal: req.signal });
  }
}

export class AIManager {
  private models = new Map<string, LocalModel>();
  private activeFast: LocalModel | null = null;
  private activeBalanced: LocalModel | null = null;

  register(model: LocalModel) {
    this.models.set(model.id, model);
    if (model.tier === 'fast' && !this.activeFast) this.activeFast = model;
    if (model.tier === 'balanced' && !this.activeBalanced) this.activeBalanced = model;
    // quality is on-demand
  }

  getModel(id: string): LocalModel | undefined { return this.models.get(id); }
  list(): LocalModel[] { return [...this.models.values()]; }

  // For Electron Main to create engines pointing at llama-server ports
  createModelFromManifest(manifest: { id: string; displayName: string; version: string; tier: 'fast' | 'balanced' | 'quality'; baseUrl: string }) {
    const engine = new InferenceEngine({ baseUrl: manifest.baseUrl, modelId: manifest.id });
    const m = new LocalModelImpl(manifest.id, manifest.displayName, manifest.version, manifest.tier, engine);
    this.register(m);
    return m;
  }

  // Three-layer pipeline: caller decides tier, we produce structured corrections
  async correctGrammar(text: string, opts?: { before?: string; after?: string; tier?: 'fast' | 'balanced'; sentenceOffset?: number; sentenceIndex?: number; signal?: AbortSignal }): Promise<Suggestion[]> {
    const tier = opts?.tier ?? 'fast';
    const model = tier === 'fast' ? (this.activeFast ?? this.activeBalanced) : (this.activeBalanced ?? this.activeFast);
    if (!model) throw new Error(`No ${tier} model registered`);

    const target = text;
    const prompt = `${GRAMMAR_SYSTEM_PROMPT}\n\n${buildGrammarPrompt({ target, before: opts?.before, after: opts?.after })}`;
    const res = await model.generate({ prompt, jsonSchema: CORRECTION_JSON_SCHEMA as any, signal: opts?.signal });
    const raw = parseCorrectionsJson(res.text);
    const validated = validateCorrections(target, raw, { minConfidence: 0.6, maxReplacementLen: 80 });
    // Note: raw offsets are relative to TARGET, need to add sentenceOffset for global
    return rawToSuggestions(validated, opts?.sentenceOffset ?? 0, opts?.sentenceIndex ?? 0, text);
  }

  async rewrite(text: string, style: string, opts?: { instruction?: string; tier?: 'balanced' | 'quality'; signal?: AbortSignal }): Promise<string> {
    const tier = opts?.tier ?? 'balanced';
    const model = tier === 'quality' ? ([...this.models.values()].find(m => m.tier === 'quality') ?? this.activeBalanced) : this.activeBalanced;
    if (!model) throw new Error(`No ${tier} model for rewrite`);
    const prompt = buildRewritePrompt(text, style, opts?.instruction);
    const res = await model.generate({ prompt, signal: opts?.signal });
    // For rewrite, model returns plain corrected text (not JSON)
    return res.text.trim();
  }

  async explainCorrection(correction: Suggestion, context?: string): Promise<string> {
    const model = this.activeBalanced ?? this.activeFast;
    if (!model) return correction.explanation;
    const prompt = `Explain why "${correction.original}" should be "${correction.replacement}" in: "${context || correction.original}". One sentence.`;
    const res = await model.generate({ prompt });
    return res.text.trim() || correction.explanation;
  }

  async detectTone(text: string): Promise<import('../types').ToneAnalysis> {
    // Keep heuristic for now; model-based tone can replace src/engine/toneDetector later
    const { analyzeTone } = await import('../engine/toneDetector');
    return analyzeTone(text);
  }
}

export const aiManager = new AIManager();
