// InferenceEngine — thin HTTP client to llama-server (separate process per spec §7)
// Electron Main spawns `llama-server --model <gguf> --port <n>`, this class talks to it.

export interface GenerationRequest {
  prompt: string;
  jsonSchema?: object;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface GenerationResult {
  text: string;
  latencyMs: number;
  tokensPerSecond?: number;
}

export class InferenceEngine {
  private baseUrl: string;
  private modelId: string;

  constructor(opts: { baseUrl: string; modelId: string }) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
    this.modelId = opts.modelId;
  }

  // For future: spawn is done in Electron Main (UtilityProcess), not here.
  // This engine is renderer-agnostic and can also be used from Main.

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    const t0 = performance.now();
    // Try llama-server OpenAI-compatible /completion first, fallback to /v1/chat/completions
    // We send prompt + optional json_schema for GBNF constraints (llama.cpp grammars)
    const body: any = {
      prompt: req.prompt,
      temperature: req.temperature ?? 0.2,
      n_predict: req.maxTokens ?? 512,
      stream: false,
    };
    if (req.jsonSchema) {
      body.json_schema = req.jsonSchema; // llama-server supports json_schema → GBNF
    }

    let text = '';
    try {
      const res = await fetch(`${this.baseUrl}/completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: req.signal,
      });
      if (!res.ok) throw new Error(`llama-server ${res.status}`);
      const data = await res.json();
      text = data.content ?? data.response ?? data.choices?.[0]?.text ?? '';
    } catch (e: any) {
      if (e?.name === 'AbortError') throw e;
      // Fallback: try OpenAI chat completions shape
      try {
        const res2 = await fetch(`${this.baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.modelId,
            messages: [{ role: 'user', content: req.prompt }],
            temperature: req.temperature ?? 0.2,
            max_tokens: req.maxTokens ?? 512,
            response_format: req.jsonSchema ? { type: 'json_object' } : undefined,
          }),
          signal: req.signal,
        });
        const data2 = await res2.json();
        text = data2.choices?.[0]?.message?.content ?? '';
      } catch {
        throw new Error(`Inference failed for ${this.modelId}: ${e?.message || 'unknown'}`);
      }
    }

    const latencyMs = Math.round(performance.now() - t0);
    return { text, latencyMs };
  }

  async health(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`, { signal: AbortSignal.timeout(1500) });
      return res.ok;
    } catch { return false; }
  }

  getModelId() { return this.modelId; }
  getBaseUrl() { return this.baseUrl; }
}
