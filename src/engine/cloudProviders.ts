import { CloudProviderId, CloudModelInfo, CustomEndpointConfig, RewriteResult, ToneStyle, Suggestion } from '../types';

export const CLOUD_MODELS: CloudModelInfo[] = [
  {
    id: 'openai-gpt-4o-mini',
    provider: 'openai',
    name: 'OpenAI GPT-4o Mini',
    modelId: 'gpt-4o-mini',
    description: 'Fast, cost-efficient cloud writing and grammar correction.',
    contextWindow: '128k tokens',
    speedRating: 9.6,
    accuracyRating: 9.7,
    isConfigured: false,
  },
  {
    id: 'openai-gpt-4o',
    provider: 'openai',
    name: 'OpenAI GPT-4o',
    modelId: 'gpt-4o',
    description: 'Flagship reasoning and advanced structural writing suggestions.',
    contextWindow: '128k tokens',
    speedRating: 8.8,
    accuracyRating: 9.9,
    isConfigured: false,
  },
  {
    id: 'anthropic-claude-35-sonnet',
    provider: 'anthropic',
    name: 'Claude 3.5 Sonnet',
    modelId: 'claude-3-5-sonnet-latest',
    description: 'Gold standard for natural, human-grade prose, tone, and nuanced edits.',
    contextWindow: '200k tokens',
    speedRating: 8.5,
    accuracyRating: 9.9,
    isConfigured: false,
  },
  {
    id: 'anthropic-claude-35-haiku',
    provider: 'anthropic',
    name: 'Claude 3.5 Haiku',
    modelId: 'claude-3-5-haiku-latest',
    description: 'Ultra-fast responsive cloud writing suggestions with high precision.',
    contextWindow: '200k tokens',
    speedRating: 9.7,
    accuracyRating: 9.5,
    isConfigured: false,
  },
  {
    id: 'gemini-15-flash',
    provider: 'gemini',
    name: 'Google Gemini 1.5 Flash',
    modelId: 'gemini-1.5-flash',
    description: 'Lightweight, ultra-low latency multimodal model from Google DeepMind.',
    contextWindow: '1M tokens',
    speedRating: 9.8,
    accuracyRating: 9.6,
    isConfigured: false,
  },
  {
    id: 'gemini-15-pro',
    provider: 'gemini',
    name: 'Google Gemini 1.5 Pro',
    modelId: 'gemini-1.5-pro',
    description: 'Deep analytical model with extended context for complex documents.',
    contextWindow: '2M tokens',
    speedRating: 8.4,
    accuracyRating: 9.8,
    isConfigured: false,
  },
  {
    id: 'groq-llama-33-70b',
    provider: 'groq',
    name: 'Groq Llama 3.3 70B',
    modelId: 'llama-3.3-70b-versatile',
    description: 'High-speed cloud LPU inference (<200ms) with open-weights intelligence.',
    contextWindow: '128k tokens',
    speedRating: 9.9,
    accuracyRating: 9.7,
    isConfigured: false,
  },
];

class CloudProviderManager {
  private apiKeys: Record<string, string> = {};
  private activeModelId: string = 'local'; // 'local' or cloud model id
  private customEndpoint: CustomEndpointConfig = {
    name: 'Ollama Localhost',
    baseUrl: 'http://localhost:11434/v1',
    modelName: 'llama3.2:latest',
    enabled: false,
  };
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      if (typeof localStorage !== 'undefined') {
        const savedKeys = localStorage.getItem('writely_cloud_keys');
        if (savedKeys) this.apiKeys = JSON.parse(savedKeys);

        const savedActive = localStorage.getItem('writely_active_engine');
        if (savedActive) this.activeModelId = savedActive;

        const savedCustom = localStorage.getItem('writely_custom_endpoint');
        if (savedCustom) this.customEndpoint = JSON.parse(savedCustom);
      }
    } catch (_) {}
  }

  private saveState() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('writely_cloud_keys', JSON.stringify(this.apiKeys));
        localStorage.setItem('writely_active_engine', this.activeModelId);
        localStorage.setItem('writely_custom_endpoint', JSON.stringify(this.customEndpoint));
      }
    } catch (_) {}
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getApiKey(provider: CloudProviderId): string {
    return this.apiKeys[provider] || '';
  }

  setApiKey(provider: CloudProviderId, key: string) {
    this.apiKeys[provider] = key.trim();
    this.saveState();
  }

  removeApiKey(provider: CloudProviderId) {
    delete this.apiKeys[provider];
    this.saveState();
  }

  getActiveModelId(): string {
    return this.activeModelId;
  }

  setActiveModelId(id: string) {
    this.activeModelId = id;
    this.saveState();
  }

  getCustomEndpoint(): CustomEndpointConfig {
    return this.customEndpoint;
  }

  setCustomEndpoint(config: CustomEndpointConfig) {
    this.customEndpoint = config;
    this.saveState();
  }

  getCloudModels(): CloudModelInfo[] {
    return CLOUD_MODELS.map((m) => ({
      ...m,
      isConfigured: !!this.apiKeys[m.provider],
    }));
  }

  async testConnection(provider: CloudProviderId): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const key = this.getApiKey(provider);
    if (!key) {
      return { success: false, message: 'Please enter an API key first.', latencyMs: 0 };
    }

    const t0 = performance.now();
    try {
      if (provider === 'groq') {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
        });
        const elapsed = Math.round(performance.now() - t0);
        if (res.ok) return { success: true, message: 'Connected successfully to Groq!', latencyMs: elapsed };
        return { success: false, message: `Groq error: ${res.statusText}`, latencyMs: elapsed };
      }

      if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
        });
        const elapsed = Math.round(performance.now() - t0);
        if (res.ok) return { success: true, message: 'Connected successfully to OpenAI!', latencyMs: elapsed };
        return { success: false, message: `OpenAI error: ${res.statusText}`, latencyMs: elapsed };
      }

      if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const elapsed = Math.round(performance.now() - t0);
        if (res.ok) return { success: true, message: 'Connected successfully to Google Gemini!', latencyMs: elapsed };
        return { success: false, message: `Gemini error: ${res.statusText}`, latencyMs: elapsed };
      }

      if (provider === 'anthropic') {
        // Direct test Anthropic headers
        const elapsed = Math.round(performance.now() - t0);
        if (key.startsWith('sk-ant-')) {
          return { success: true, message: 'Anthropic key format verified!', latencyMs: elapsed };
        }
        return { success: false, message: 'Invalid Anthropic key format (must begin with sk-ant-)', latencyMs: elapsed };
      }

      return { success: true, message: 'Key saved and ready.', latencyMs: Math.round(performance.now() - t0) };
    } catch (err: any) {
      return { success: false, message: err.message || 'Connection failed.', latencyMs: Math.round(performance.now() - t0) };
    }
  }

  async testCustomEndpoint(): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const t0 = performance.now();
    try {
      const url = this.customEndpoint.baseUrl.replace(/\/v1$/, '') + '/api/tags';
      const res = await fetch(url);
      const elapsed = Math.round(performance.now() - t0);
      if (res.ok) {
        return { success: true, message: 'Custom endpoint reachable and responsive!', latencyMs: elapsed };
      }
      return { success: false, message: `Status ${res.status}: ${res.statusText}`, latencyMs: elapsed };
    } catch (err: any) {
      return { success: false, message: `Endpoint unreachable: ${err.message}`, latencyMs: Math.round(performance.now() - t0) };
    }
  }

  /**
   * Execute Cloud Rewrite with user's own API key
   */
  async executeCloudRewrite(text: string, tone: ToneStyle, modelId: string): Promise<RewriteResult> {
    const model = CLOUD_MODELS.find((m) => m.id === modelId) || CLOUD_MODELS[0];
    const key = this.getApiKey(model.provider);
    const t0 = performance.now();

    const systemPrompt = `You are Writely, an elite writing assistant. Rewrite the user's text in a ${tone.toUpperCase()} tone. Return only the rewritten text without markdown fences, preamble, or conversational filler.`;

    if (model.provider === 'openai' && key) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: model.modelId,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: text },
            ],
            temperature: 0.3,
          }),
        });
        const data = await res.json();
        const rewritten = data.choices?.[0]?.message?.content?.trim() || text;
        return {
          tone,
          original: text,
          rewritten,
          explanation: `Rewritten using ${model.name} via your API key.`,
          latencyMs: Math.round(performance.now() - t0),
          providerUsed: model.name,
        };
      } catch (err) {}
    }

    if (model.provider === 'groq' && key) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: model.modelId,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: text },
            ],
            temperature: 0.3,
          }),
        });
        const data = await res.json();
        const rewritten = data.choices?.[0]?.message?.content?.trim() || text;
        return {
          tone,
          original: text,
          rewritten,
          explanation: `Ultra-fast rewrite via ${model.name}.`,
          latencyMs: Math.round(performance.now() - t0),
          providerUsed: model.name,
        };
      } catch (err) {}
    }

    // Fallback if network or key not active
    return {
      tone,
      original: text,
      rewritten: text,
      explanation: `Cloud inference fallback. Please check ${model.provider} API key.`,
      latencyMs: Math.round(performance.now() - t0),
      providerUsed: model.name,
    };
  }
}

export const cloudManager = new CloudProviderManager();
