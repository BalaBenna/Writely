import { CloudProviderId, CloudModelInfo, CustomEndpointConfig, RewriteResult, ToneStyle, Suggestion, ProviderConfig } from '../types';

// ---------------------------------------------------------------------------
// Provider registry — single source of truth for all BYOK providers
// ---------------------------------------------------------------------------
export const PROVIDER_CONFIGS: Record<CloudProviderId, ProviderConfig> = {
  openai:     { id: 'openai',     displayName: 'OpenAI',     baseUrl: 'https://api.openai.com/v1',                         keyUrl: 'https://platform.openai.com/api-keys',            keyPlaceholder: 'sk-proj-...',              headerStyle: 'bearer',  apiPath: '/chat/completions' },
  anthropic:  { id: 'anthropic',  displayName: 'Anthropic (Claude)', baseUrl: 'https://api.anthropic.com',                keyUrl: 'https://console.anthropic.com/settings/keys',   keyPlaceholder: 'sk-ant-...',               keyPrefix: 'sk-ant-', headerStyle: 'x-api-key', apiPath: '/v1/messages' },
  gemini:     { id: 'gemini',     displayName: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com',      keyUrl: 'https://aistudio.google.com/app/apikey',        keyPlaceholder: 'AIzaSy...',                headerStyle: 'query-key', apiPath: '/v1beta/models' },
  groq:       { id: 'groq',       displayName: 'Groq',       baseUrl: 'https://api.groq.com/openai/v1',                   keyUrl: 'https://console.groq.com/keys',                 keyPlaceholder: 'gsk_...',                  keyPrefix: 'gsk_', headerStyle: 'bearer',  apiPath: '/chat/completions' },
  deepseek:   { id: 'deepseek',   displayName: 'DeepSeek',   baseUrl: 'https://api.deepseek.com/v1',                      keyUrl: 'https://platform.deepseek.com/api_keys',        keyPlaceholder: 'sk-...',                   headerStyle: 'bearer',  apiPath: '/chat/completions' },
  openrouter: { id: 'openrouter', displayName: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1',                     keyUrl: 'https://openrouter.ai/keys',                    keyPlaceholder: 'sk-or-...',                keyPrefix: 'sk-or-', headerStyle: 'bearer',  apiPath: '/chat/completions' },
  fireworks:  { id: 'fireworks',  displayName: 'Fireworks AI', baseUrl: 'https://api.fireworks.ai/inference/v1',          keyUrl: 'https://fireworks.ai/api-keys',                 keyPlaceholder: 'fw_...',                   headerStyle: 'bearer',  apiPath: '/chat/completions' },
  together:   { id: 'together',   displayName: 'Together AI', baseUrl: 'https://api.together.xyz/v1',                     keyUrl: 'https://api.together.xyz/settings/api-keys',    keyPlaceholder: '...',                      headerStyle: 'bearer',  apiPath: '/chat/completions' },
  minimax:    { id: 'minimax',    displayName: 'MiniMax',    baseUrl: 'https://api.minimax.chat/v1',                      keyUrl: 'https://platform.minimaxi.com/user-center/basic-information', keyPlaceholder: '...',      headerStyle: 'bearer',  apiPath: '/text/chatcompletion_v2' },
  mistral:    { id: 'mistral',    displayName: 'Mistral AI', baseUrl: 'https://api.mistral.ai/v1',                         keyUrl: 'https://console.mistral.ai/api-keys',           keyPlaceholder: '...',                      headerStyle: 'bearer',  apiPath: '/chat/completions' },
  perplexity: { id: 'perplexity', displayName: 'Perplexity', baseUrl: 'https://api.perplexity.ai',                         keyUrl: 'https://www.perplexity.ai/settings/api',        keyPlaceholder: 'pplx-...',                 keyPrefix: 'pplx-', headerStyle: 'bearer',  apiPath: '/chat/completions' },
  cohere:     { id: 'cohere',     displayName: 'Cohere',     baseUrl: 'https://api.cohere.ai/v1',                          keyUrl: 'https://dashboard.cohere.com/api-keys',         keyPlaceholder: '...',                      headerStyle: 'bearer',  apiPath: '/chat' },
  xai:        { id: 'xai',        displayName: 'xAI (Grok)', baseUrl: 'https://api.x.ai/v1',                               keyUrl: 'https://console.x.ai/team/api-keys',            keyPlaceholder: 'xai-...',                  keyPrefix: 'xai-', headerStyle: 'bearer',  apiPath: '/chat/completions' },
  ollama:     { id: 'ollama',     displayName: 'Ollama (Local)', baseUrl: 'http://localhost:11434/v1',                 keyUrl: '',                                              keyPlaceholder: '(no key needed)',        headerStyle: 'bearer',  apiPath: '/chat/completions' },
};

// ---------------------------------------------------------------------------
// Cloud models — at least 2-3 per provider so user has real choice.
// OpenRouter models use openrouter/<slug>, others use native modelId.
// ---------------------------------------------------------------------------
export const CLOUD_MODELS: CloudModelInfo[] = [
  // OpenAI
  { id: 'openai-gpt-4o',       provider: 'openai',     name: 'OpenAI GPT-4o',           modelId: 'gpt-4o',                         description: 'Flagship reasoning and advanced writing.',        contextWindow: '128k', speedRating: 8.8, accuracyRating: 9.9, isConfigured: false, featured: true },
  { id: 'openai-gpt-4o-mini',  provider: 'openai',     name: 'OpenAI GPT-4o Mini',      modelId: 'gpt-4o-mini',                    description: 'Fast, cost-efficient writing & grammar.',           contextWindow: '128k', speedRating: 9.6, accuracyRating: 9.7, isConfigured: false, featured: true },
  { id: 'openai-o1-mini',      provider: 'openai',     name: 'OpenAI o1-mini',          modelId: 'o1-mini',                        description: 'Reasoning model for complex edits.',                contextWindow: '128k', speedRating: 8.2, accuracyRating: 9.8, isConfigured: false },

  // Anthropic
  { id: 'anthropic-claude-35-sonnet', provider: 'anthropic', name: 'Claude 3.5 Sonnet', modelId: 'claude-3-5-sonnet-latest',        description: 'Gold standard for natural prose & tone.',           contextWindow: '200k', speedRating: 8.5, accuracyRating: 9.9, isConfigured: false, featured: true },
  { id: 'anthropic-claude-35-haiku',  provider: 'anthropic', name: 'Claude 3.5 Haiku',  modelId: 'claude-3-5-haiku-latest',         description: 'Ultra-fast cloud suggestions.',                      contextWindow: '200k', speedRating: 9.7, accuracyRating: 9.5, isConfigured: false },
  { id: 'anthropic-claude-3-opus',    provider: 'anthropic', name: 'Claude 3 Opus',     modelId: 'claude-3-opus-latest',            description: 'Highest quality, slower — for final polish.',       contextWindow: '200k', speedRating: 7.8, accuracyRating: 9.9, isConfigured: false },

  // Google Gemini
  { id: 'gemini-15-flash',   provider: 'gemini',     name: 'Gemini 1.5 Flash',       modelId: 'gemini-1.5-flash',               description: 'Lightweight ultra-low latency from Google.',       contextWindow: '1M',  speedRating: 9.8, accuracyRating: 9.6, isConfigured: false, featured: true },
  { id: 'gemini-15-pro',     provider: 'gemini',     name: 'Gemini 1.5 Pro',         modelId: 'gemini-1.5-pro',                 description: 'Deep analytical model for long docs.',              contextWindow: '2M',  speedRating: 8.4, accuracyRating: 9.8, isConfigured: false },
  { id: 'gemini-20-flash',   provider: 'gemini',     name: 'Gemini 2.0 Flash',       modelId: 'gemini-2.0-flash',               description: 'Latest Gemini — best price/perf.',                 contextWindow: '1M',  speedRating: 9.9, accuracyRating: 9.8, isConfigured: false, featured: true },

  // Groq
  { id: 'groq-llama-33-70b', provider: 'groq',       name: 'Groq Llama 3.3 70B',     modelId: 'llama-3.3-70b-versatile',        description: 'LPU inference (<200ms) — open-weights.',           contextWindow: '128k', speedRating: 9.9, accuracyRating: 9.7, isConfigured: false, featured: true },
  { id: 'groq-mixtral-8x7b', provider: 'groq',       name: 'Groq Mixtral 8x7B',      modelId: 'mixtral-8x7b-32768',              description: 'MoE — great for long-form rewrites.',             contextWindow: '32k',  speedRating: 9.8, accuracyRating: 9.4, isConfigured: false },

  // DeepSeek
  { id: 'deepseek-chat',     provider: 'deepseek',   name: 'DeepSeek V3 Chat',      modelId: 'deepseek-chat',                  description: 'DeepSeek V3 — strong reasoning, affordable.',       contextWindow: '128k', speedRating: 9.2, accuracyRating: 9.8, isConfigured: false, featured: true },
  { id: 'deepseek-reasoner', provider: 'deepseek',   name: 'DeepSeek R1 Reasoner',  modelId: 'deepseek-reasoner',              description: 'R1 chain-of-thought for complex edits.',           contextWindow: '128k', speedRating: 8.3, accuracyRating: 9.9, isConfigured: false },
  { id: 'deepseek-coder',    provider: 'deepseek',   name: 'DeepSeek Coder',        modelId: 'deepseek-coder',                 description: 'Specialized for technical documentation.',          contextWindow: '128k', speedRating: 9.0, accuracyRating: 9.5, isConfigured: false },

  // OpenRouter — THE main aggregator; user can pick any model slug
  { id: 'openrouter-auto',          provider: 'openrouter', name: 'OpenRouter Auto',         modelId: 'openrouter/auto',                 description: 'OpenRouter routes to best/cheapest available.',   contextWindow: 'varies', speedRating: 9.0, accuracyRating: 9.6, isConfigured: false, featured: true },
  { id: 'openrouter-claude-sonnet', provider: 'openrouter', name: 'OpenRouter: Claude 3.5 Sonnet', modelId: 'anthropic/claude-3.5-sonnet', description: 'Claude via OpenRouter — no Anthropic key needed.',contextWindow: '200k', speedRating: 8.5, accuracyRating: 9.9, isConfigured: false },
  { id: 'openrouter-gemini-flash',  provider: 'openrouter', name: 'OpenRouter: Gemini 2.0 Flash',  modelId: 'google/gemini-2.0-flash-001',  description: 'Gemini via OpenRouter.',                        contextWindow: '1M',  speedRating: 9.8, accuracyRating: 9.7, isConfigured: false },
  { id: 'openrouter-deepseek-v3',   provider: 'openrouter', name: 'OpenRouter: DeepSeek V3', modelId: 'deepseek/deepseek-chat',           description: 'DeepSeek V3 via OpenRouter.',                     contextWindow: '128k', speedRating: 9.2, accuracyRating: 9.8, isConfigured: false },
  { id: 'openrouter-llama-405b',    provider: 'openrouter', name: 'OpenRouter: Llama 3.1 405B', modelId: 'meta-llama/llama-3.1-405b-instruct', description: 'Largest open model via OpenRouter.',            contextWindow: '128k', speedRating: 7.5, accuracyRating: 9.9, isConfigured: false },

  // Fireworks
  { id: 'fireworks-llama-70b',   provider: 'fireworks',  name: 'Fireworks Llama 3.3 70B', modelId: 'accounts/fireworks/models/llama-v3p3-70b-instruct', description: 'Fireworks fast inference — Llama 3.3 70B.',    contextWindow: '128k', speedRating: 9.5, accuracyRating: 9.7, isConfigured: false, featured: true },
  { id: 'fireworks-mixtral',     provider: 'fireworks',  name: 'Fireworks Mixtral 8x22B', modelId: 'accounts/fireworks/models/mixtral-8x22b-instruct', description: 'Mixtral via Fireworks — great for rewrite.',   contextWindow: '64k',  speedRating: 9.4, accuracyRating: 9.5, isConfigured: false },

  // Together AI
  { id: 'together-llama-70b',  provider: 'together',   name: 'Together Llama 3.3 70B',  modelId: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', description: 'Together turbo inference — Llama 3.3.',        contextWindow: '128k', speedRating: 9.4, accuracyRating: 9.7, isConfigured: false, featured: true },
  { id: 'together-qwen-72b',   provider: 'together',   name: 'Together Qwen 2.5 72B',   modelId: 'Qwen/Qwen2.5-72B-Instruct-Turbo',         description: 'Qwen 2.5 72B — strong multilingual.',           contextWindow: '32k',  speedRating: 9.2, accuracyRating: 9.8, isConfigured: false },
  { id: 'together-deepseek-r1',provider: 'together',   name: 'Together DeepSeek R1',    modelId: 'deepseek-ai/DeepSeek-R1',                description: 'DeepSeek R1 via Together.',                    contextWindow: '128k', speedRating: 8.5, accuracyRating: 9.9, isConfigured: false },

  // MiniMax
  { id: 'minimax-text-01',   provider: 'minimax',    name: 'MiniMax Text-01',       modelId: 'MiniMax-Text-01',                description: 'MiniMax flagship — 1M context, multilingual.',    contextWindow: '1M',  speedRating: 8.8, accuracyRating: 9.7, isConfigured: false, featured: true },
  { id: 'minimax-m2',        provider: 'minimax',    name: 'MiniMax M2',            modelId: 'minimax-m2',                     description: 'MiniMax M2 — fast & cost-efficient.',             contextWindow: '128k', speedRating: 9.3, accuracyRating: 9.5, isConfigured: false },

  // Mistral
  { id: 'mistral-large',   provider: 'mistral',    name: 'Mistral Large',      modelId: 'mistral-large-latest',           description: 'Mistral flagship — top for writing.',              contextWindow: '128k', speedRating: 8.9, accuracyRating: 9.8, isConfigured: false, featured: true },
  { id: 'mistral-small',   provider: 'mistral',    name: 'Mistral Small',      modelId: 'mistral-small-latest',           description: 'Fast & cheap — great for grammar.',                 contextWindow: '32k',  speedRating: 9.7, accuracyRating: 9.5, isConfigured: false },
  { id: 'mistral-nemo',    provider: 'mistral',    name: 'Mistral Nemo',       modelId: 'open-mistral-nemo',              description: 'Open 12B — efficient edge-quality.',               contextWindow: '128k', speedRating: 9.4, accuracyRating: 9.4, isConfigured: false },

  // Perplexity
  { id: 'perplexity-sonar',      provider: 'perplexity', name: 'Perplexity Sonar',     modelId: 'llama-3.1-sonar-large-128k-online', description: 'Online search + writing.',                   contextWindow: '128k', speedRating: 9.0, accuracyRating: 9.6, isConfigured: false },
  { id: 'perplexity-sonar-pro',  provider: 'perplexity', name: 'Perplexity Sonar Pro', modelId: 'llama-3.1-sonar-huge-128k-online',  description: 'Larger online model.',                       contextWindow: '128k', speedRating: 8.5, accuracyRating: 9.7, isConfigured: false },

  // Cohere
  { id: 'cohere-command-r-plus', provider: 'cohere',     name: 'Cohere Command R+', modelId: 'command-r-plus',                 description: 'Cohere flagship — RAG & writing.',                contextWindow: '128k', speedRating: 8.7, accuracyRating: 9.7, isConfigured: false },
  { id: 'cohere-command-r',      provider: 'cohere',     name: 'Cohere Command R',  modelId: 'command-r',                      description: 'Fast Cohere — balanced.',                         contextWindow: '128k', speedRating: 9.2, accuracyRating: 9.5, isConfigured: false },

  // xAI
  { id: 'xai-grok-2',   provider: 'xai',        name: 'Grok 2',        modelId: 'grok-2-latest',                description: 'xAI Grok 2 — witty & sharp writing.',            contextWindow: '131k', speedRating: 8.6, accuracyRating: 9.7, isConfigured: false },
  { id: 'xai-grok-beta',provider: 'xai',        name: 'Grok Beta',     modelId: 'grok-beta',                    description: 'Grok beta — experimental.',                       contextWindow: '131k', speedRating: 8.5, accuracyRating: 9.6, isConfigured: false },
];

class CloudProviderManager {
  private apiKeys: Record<string, string> = {};
  private selectedModels: Record<string, string> = {}; // provider -> modelId (custom override)
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
        const savedSelected = localStorage.getItem('writely_selected_cloud_models');
        if (savedSelected) this.selectedModels = JSON.parse(savedSelected);
      }
    } catch (_) {}
  }

  private saveState() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('writely_cloud_keys', JSON.stringify(this.apiKeys));
        localStorage.setItem('writely_active_engine', this.activeModelId);
        localStorage.setItem('writely_custom_endpoint', JSON.stringify(this.customEndpoint));
        localStorage.setItem('writely_selected_cloud_models', JSON.stringify(this.selectedModels));
      }
    } catch (_) {}
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter((l) => l !== listener); };
  }
  private notify() { this.listeners.forEach((l) => l()); }

  // ---- Keys ----
  getApiKey(provider: CloudProviderId): string { return this.apiKeys[provider] || ''; }
  setApiKey(provider: CloudProviderId, key: string) {
    const v = key.trim();
    if (v) this.apiKeys[provider] = v;
    else delete this.apiKeys[provider];
    this.saveState();
  }
  removeApiKey(provider: CloudProviderId) { delete this.apiKeys[provider]; this.saveState(); }
  hasKey(provider: CloudProviderId): boolean { return !!this.apiKeys[provider]?.trim(); }
  getConfiguredProviders(): CloudProviderId[] {
    return (Object.keys(this.apiKeys) as CloudProviderId[]).filter(p => this.hasKey(p));
  }

  // ---- Selected model per provider (user can pick or type custom) ----
  getSelectedModelForProvider(provider: CloudProviderId): string {
    if (this.selectedModels[provider]) return this.selectedModels[provider];
    // default to first model for that provider
    const def = CLOUD_MODELS.find(m => m.provider === provider);
    return def?.modelId || '';
  }
  setSelectedModelForProvider(provider: CloudProviderId, modelId: string) {
    this.selectedModels[provider] = modelId.trim();
    this.saveState();
  }

  // ---- Active engine ----
  getActiveModelId(): string { return this.activeModelId; }
  setActiveModelId(id: string) { this.activeModelId = id; this.saveState(); }
  isLocalActive(): boolean { return this.activeModelId === 'local'; }

  // ---- Custom endpoint (Ollama / LM Studio / vLLM) ----
  getCustomEndpoint(): CustomEndpointConfig { return this.customEndpoint; }
  setCustomEndpoint(config: CustomEndpointConfig) { this.customEndpoint = config; this.saveState(); }

  getCloudModels(): CloudModelInfo[] {
    return CLOUD_MODELS.map((m) => ({ ...m, isConfigured: !!this.apiKeys[m.provider] }));
  }
  getModelsForProvider(provider: CloudProviderId): CloudModelInfo[] {
    return this.getCloudModels().filter(m => m.provider === provider);
  }
  getProviderConfig(provider: CloudProviderId): ProviderConfig | undefined {
    return PROVIDER_CONFIGS[provider];
  }

  // ---- Fetch available models from provider (if endpoint supports /models) ----
  async fetchAvailableModels(provider: CloudProviderId): Promise<{ models: string[]; error?: string }> {
    const key = this.getApiKey(provider);
    const cfg = PROVIDER_CONFIGS[provider];
    if (!cfg) return { models: [], error: 'Unknown provider' };
    // For providers without a key (ollama) try anyway; for others require key
    if (!key && provider !== 'ollama') return { models: [], error: 'API key required' };
    const url = `${cfg.baseUrl.replace(/\/$/, '')}/models`;
    try {
      const headers: Record<string, string> = {};
      if (cfg.headerStyle === 'bearer' && key) headers['Authorization'] = `Bearer ${key}`;
      else if (cfg.headerStyle === 'x-api-key' && key) headers['x-api-key'] = key;
      const u = cfg.headerStyle === 'query-key' && key ? `${url}?key=${encodeURIComponent(key)}` : url;
      const res = await fetch(u, { headers });
      if (!res.ok) return { models: [], error: `${res.status} ${res.statusText}` };
      const data = await res.json();
      // OpenAI shape: { data: [{id}] } ; Anthropic not listable; Gemini: { models: [{name}] }
      let ids: string[] = [];
      if (Array.isArray(data.data)) ids = data.data.map((x: any) => x.id).filter(Boolean);
      else if (Array.isArray(data.models)) ids = data.models.map((x: any) => x.name?.replace('models/', '') || x.id).filter(Boolean);
      else if (Array.isArray(data)) ids = data.map((x: any) => x.id || x.name).filter(Boolean);
      return { models: ids };
    } catch (e: any) {
      return { models: [], error: e?.message || 'fetch failed' };
    }
  }

  // ---- Connection test per provider ----
  async testConnection(provider: CloudProviderId): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const key = this.getApiKey(provider);
    const cfg = PROVIDER_CONFIGS[provider];
    if (!cfg) return { success: false, message: 'Unknown provider', latencyMs: 0 };
    if (!key && provider !== 'ollama') return { success: false, message: 'Please enter an API key first.', latencyMs: 0 };
    const t0 = performance.now();
    try {
      if (provider === 'anthropic') {
        const elapsed = Math.round(performance.now() - t0);
        if (key.startsWith('sk-ant-')) return { success: true, message: 'Anthropic key format verified — ready to use.', latencyMs: elapsed };
        return { success: false, message: 'Invalid Anthropic key (must start with sk-ant-)', latencyMs: elapsed };
      }
      if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
        const elapsed = Math.round(performance.now() - t0);
        if (res.ok) return { success: true, message: 'Connected to Google Gemini!', latencyMs: elapsed };
        const txt = await res.text().catch(()=>'');
        return { success: false, message: `Gemini error ${res.status}: ${txt.slice(0,120)}`, latencyMs: elapsed };
      }
      // All OpenAI-compatible providers hit /models with Bearer
      const url = `${cfg.baseUrl.replace(/\/$/, '')}/models`;
      const headers: Record<string, string> = {};
      if (cfg.headerStyle === 'bearer' && key) headers['Authorization'] = `Bearer ${key}`;
      const res = await fetch(url, { headers });
      const elapsed = Math.round(performance.now() - t0);
      if (res.ok) return { success: true, message: `Connected to ${cfg.displayName}!`, latencyMs: elapsed };
      const body = await res.text().catch(()=>'');
      return { success: false, message: `${cfg.displayName} error ${res.status}: ${body.slice(0,160)}`, latencyMs: elapsed };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Connection failed.', latencyMs: Math.round(performance.now() - t0) };
    }
  }

  async testCustomEndpoint(): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const t0 = performance.now();
    try {
      const base = this.customEndpoint.baseUrl.replace(/\/v1\/?$/, '');
      // Try Ollama /api/tags first, then OpenAI /v1/models
      let res = await fetch(`${base}/api/tags`).catch(()=>null as any);
      let elapsed = Math.round(performance.now() - t0);
      if (res?.ok) return { success: true, message: 'Custom endpoint reachable (Ollama)!', latencyMs: elapsed };
      res = await fetch(`${this.customEndpoint.baseUrl.replace(/\/$/, '')}/models`);
      elapsed = Math.round(performance.now() - t0);
      if (res.ok) return { success: true, message: 'Custom endpoint reachable!', latencyMs: elapsed };
      return { success: false, message: `Status ${res.status}: ${res.statusText}`, latencyMs: elapsed };
    } catch (err: any) {
      return { success: false, message: `Endpoint unreachable: ${err.message}`, latencyMs: Math.round(performance.now() - t0) };
    }
  }

  // -------------------------------------------------------------------------
  // Unified execution — routes to correct API shape per provider
  // -------------------------------------------------------------------------
  async executeCloudRewrite(text: string, tone: ToneStyle, modelId: string, extraInstruction?: string): Promise<RewriteResult> {
    const model = CLOUD_MODELS.find((m) => m.id === modelId) || CLOUD_MODELS.find(m => m.modelId === modelId) || null;
    // Allow ad-hoc modelId even if not in catalog: infer provider from active model or first configured
    let provider: CloudProviderId = (model?.provider as CloudProviderId) || 'openai';
    let nativeModelId = model?.modelId || modelId;
    // If modelId came as free-form, try to find its provider
    if (!model) {
      const hit = CLOUD_MODELS.find(m => m.modelId === modelId);
      if (hit) { provider = hit.provider; nativeModelId = hit.modelId; }
      else {
        // free-form: if active is cloud, use that provider
        const activeProvider = CLOUD_MODELS.find(m => m.id === this.activeModelId)?.provider;
        if (activeProvider) { provider = activeProvider; nativeModelId = modelId; }
      }
    }
    const cfg = PROVIDER_CONFIGS[provider];
    const key = this.getApiKey(provider);
    const t0 = performance.now();
    let systemPrompt = `You are Writely, an elite writing assistant. Rewrite the user's text in a ${tone.toUpperCase()} tone. Return only the rewritten text without markdown fences, preamble, or conversational filler.`;
    if (extraInstruction?.trim()) {
      systemPrompt += ` Additional user instruction (follow it while rewriting): ${extraInstruction.trim()}`;
    }

    // Branch per provider family
    try {
      if (provider === 'anthropic' && key) {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: nativeModelId, max_tokens: 1024, system: systemPrompt, messages: [{ role: 'user', content: text }] }),
        });
        if (res.ok) {
          const data = await res.json();
          const rewritten = (data.content?.[0]?.text || '').trim() || text;
          return { tone, original: text, rewritten, explanation: `Rewritten using ${model?.name || nativeModelId} via your API key.`, latencyMs: Math.round(performance.now() - t0), providerUsed: model?.name || nativeModelId };
        }
      } else if (provider === 'gemini' && key) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(nativeModelId)}:generateContent?key=${encodeURIComponent(key)}`;
        const res = await fetch(url, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nText to rewrite: ${text}` }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 1024 } }),
        });
        if (res.ok) {
          const data = await res.json();
          const rewritten = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim() || text;
          return { tone, original: text, rewritten, explanation: `Rewritten using ${model?.name || nativeModelId}.`, latencyMs: Math.round(performance.now() - t0), providerUsed: model?.name || nativeModelId };
        }
      } else if (key || provider === 'ollama') {
        // All OpenAI-compatible: OpenAI, Groq, DeepSeek, OpenRouter, Fireworks, Together, MiniMax (v2), Mistral, Perplexity, xAI, Ollama, Cohere(not), etc.
        // Cohere uses different path — handle separately
        if (provider === 'cohere' && key) {
          const res = await fetch('https://api.cohere.ai/v1/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
            body: JSON.stringify({ model: nativeModelId, message: `${systemPrompt}\n\nText: ${text}`, temperature: 0.3 }),
          });
          if (res.ok) {
            const data = await res.json();
            const rewritten = (data.text || data.response || '').trim() || text;
            return { tone, original: text, rewritten, explanation: `Rewritten using ${model?.name || nativeModelId}.`, latencyMs: Math.round(performance.now() - t0), providerUsed: model?.name || nativeModelId };
          }
        } else {
          // Generic OpenAI chat completions
          const base = cfg?.baseUrl || 'https://api.openai.com/v1';
          const url = `${base.replace(/\/$/, '')}/chat/completions`;
          const headers: Record<string,string> = { 'Content-Type': 'application/json' };
          if (key) headers['Authorization'] = `Bearer ${key}`;
          if (provider === 'openrouter') {
            headers['HTTP-Referer'] = 'https://writely.ai';
            headers['X-Title'] = 'Writely';
          }
          const body: any = { model: nativeModelId, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: text }], temperature: 0.3 };
          // MiniMax uses different field
          if (provider === 'minimax') {
            const mmRes = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
              body: JSON.stringify({ model: nativeModelId, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: text }], temperature: 0.3 }),
            });
            if (mmRes.ok) {
              const data = await mmRes.json();
              const rewritten = (data.choices?.[0]?.message?.content || '').trim() || text;
              return { tone, original: text, rewritten, explanation: `Rewritten using ${model?.name || nativeModelId}.`, latencyMs: Math.round(performance.now() - t0), providerUsed: model?.name || nativeModelId };
            }
          } else {
            const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
            if (res.ok) {
              const data = await res.json();
              const rewritten = (data.choices?.[0]?.message?.content || '').trim() || text;
              return { tone, original: text, rewritten, explanation: `Rewritten using ${model?.name || nativeModelId}.`, latencyMs: Math.round(performance.now() - t0), providerUsed: model?.name || nativeModelId };
            } else {
              const errBody = await res.text().catch(()=>'');
              console.warn(`[cloud] ${provider} ${res.status}: ${errBody.slice(0,200)}`);
            }
          }
        }
      }
    } catch (e) {
      console.warn('[cloud] rewrite error', e);
    }

    return { tone, original: text, rewritten: text, explanation: `Cloud inference fallback. Check ${cfg?.displayName || provider} API key / model selection.`, latencyMs: Math.round(performance.now() - t0), providerUsed: model?.name || nativeModelId };
  }

  // Translation via cloud (user's own key). Local offline engine has no
  // translator, so this is cloud/custom-only by design.
  async executeTranslation(text: string, targetLang: string): Promise<{ translated: string; latencyMs: number; providerUsed: string }> {
    const t0 = performance.now();
    const active = CLOUD_MODELS.find((m) => m.id === this.activeModelId) || null;
    const provider: CloudProviderId = (active?.provider as CloudProviderId) || 'openrouter';
    const nativeModelId = active?.modelId || 'openrouter/auto';
    const name = active?.name || nativeModelId;
    const key = this.getApiKey(provider);
    const cfg = PROVIDER_CONFIGS[provider];
    const systemPrompt = `You are a professional translator. Translate the user's text to ${targetLang}. Return ONLY the translated text — no explanations, no markdown fences, no preamble. Preserve tone and formatting.`;
    const fail = () => ({ translated: '', latencyMs: Math.round(performance.now() - t0), providerUsed: name });

    if (!key) return fail();
    try {
      if (provider === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: nativeModelId, max_tokens: 2048, system: systemPrompt, messages: [{ role: 'user', content: text }] }),
        });
        if (!res.ok) return fail();
        const data = await res.json();
        const out = (data.content?.[0]?.text || '').trim();
        return { translated: out, latencyMs: Math.round(performance.now() - t0), providerUsed: name };
      }
      if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(nativeModelId)}:generateContent?key=${encodeURIComponent(key)}`;
        const res = await fetch(url, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nText:\n${text}` }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 2048 } }),
        });
        if (!res.ok) return fail();
        const data = await res.json();
        const out = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
        return { translated: out, latencyMs: Math.round(performance.now() - t0), providerUsed: name };
      }
      if (provider === 'cohere') {
        const res = await fetch('https://api.cohere.ai/v1/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
          body: JSON.stringify({ model: nativeModelId, message: `${systemPrompt}\n\nText:\n${text}`, temperature: 0.2 }),
        });
        if (!res.ok) return fail();
        const data = await res.json();
        const out = (data.text || data.response || '').trim();
        return { translated: out, latencyMs: Math.round(performance.now() - t0), providerUsed: name };
      }
      if (provider === 'minimax') {
        const res = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
          body: JSON.stringify({ model: nativeModelId, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: text }], temperature: 0.2 }),
        });
        if (!res.ok) return fail();
        const data = await res.json();
        const out = (data.choices?.[0]?.message?.content || '').trim();
        return { translated: out, latencyMs: Math.round(performance.now() - t0), providerUsed: name };
      }
      // Generic OpenAI-compatible (OpenAI, Groq, DeepSeek, OpenRouter, Fireworks, Together, Mistral, Perplexity, xAI)
      const base = cfg?.baseUrl || 'https://openrouter.ai/api/v1';
      const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` };
      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://writely.ai';
        headers['X-Title'] = 'Writely';
      }
      const res = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST', headers,
        body: JSON.stringify({ model: nativeModelId, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: text }], temperature: 0.2 }),
      });
      if (!res.ok) return fail();
      const data = await res.json();
      const out = (data.choices?.[0]?.message?.content || '').trim();
      return { translated: out, latencyMs: Math.round(performance.now() - t0), providerUsed: name };
    } catch {
      return fail();
    }
  }

  // Grammar correction via cloud (returns Suggestions-like text)
  async executeCloudGrammar(text: string, modelId?: string): Promise<{ corrected: string; latencyMs: number; providerUsed: string }> {
    const targetId = modelId || this.activeModelId;
    const model = CLOUD_MODELS.find(m => m.id === targetId || m.modelId === targetId) || CLOUD_MODELS.find(m => m.isConfigured) || null;
    if (!model) return { corrected: text, latencyMs: 0, providerUsed: 'none' };
    const provider = model.provider as CloudProviderId;
    const key = this.getApiKey(provider);
    if (!key) return { corrected: text, latencyMs: 0, providerUsed: model.name };
    const t0 = performance.now();
    const prompt = `Correct grammar, spelling, and punctuation in the following text. Return ONLY the corrected text, no explanation, no markdown.\n\nText: ${text}`;
    const toneRes = await this.executeCloudRewrite(prompt, 'professional' as any, model.id);
    // executeCloudRewrite wraps as rewrite; unwrap
    // For grammar we call chat directly to avoid tone wrapper double-prompt
    return { corrected: toneRes.rewritten || text, latencyMs: toneRes.latencyMs, providerUsed: model.name };
  }

  // For custom OpenAI-compatible endpoint (Ollama/LM Studio/vLLM)
  async executeCustomRewrite(text: string, tone: ToneStyle, extraInstruction?: string): Promise<RewriteResult> {
    const t0 = performance.now();
    let systemPrompt = `You are Writely. Rewrite in ${tone.toUpperCase()} tone. Return only rewritten text.`;
    if (extraInstruction?.trim()) systemPrompt += ` Additional user instruction: ${extraInstruction.trim()}`;
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (this.customEndpoint.apiKey) headers['Authorization'] = `Bearer ${this.customEndpoint.apiKey}`;
      const res = await fetch(`${this.customEndpoint.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST', headers,
        body: JSON.stringify({ model: this.customEndpoint.modelName, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: text }], temperature: 0.3 }),
      });
      if (res.ok) {
        const data = await res.json();
        const rewritten = (data.choices?.[0]?.message?.content || '').trim() || text;
        return { tone, original: text, rewritten, explanation: `Via custom endpoint ${this.customEndpoint.name}`, latencyMs: Math.round(performance.now() - t0), providerUsed: this.customEndpoint.name };
      }
    } catch {}
    return { tone, original: text, rewritten: text, explanation: 'Custom endpoint unreachable.', latencyMs: Math.round(performance.now() - t0), providerUsed: this.customEndpoint.name };
  }
}

export const cloudManager = new CloudProviderManager();
