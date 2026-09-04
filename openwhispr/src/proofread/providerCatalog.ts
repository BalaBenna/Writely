// Provider catalog for Writely writing assistance (ported).
// Keys live in the OS keyring via the BYOK secret manifest — never here.

export interface ProviderSpec {
  id: string;
  displayName: string;
  keyUrl: string;
  keyPlaceholder: string;
  models: { id: string; name: string; context: string }[];
}

export const WRITE_PROVIDERS: ProviderSpec[] = [
  {
    id: 'openrouter',
    displayName: 'OpenRouter',
    keyUrl: 'https://openrouter.ai/keys',
    keyPlaceholder: 'sk-or-...',
    models: [
      { id: 'openrouter/auto', name: 'Auto (best route)', context: 'varies' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', context: '200k' },
      { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', context: '1M' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', context: '128k' },
    ],
  },
  {
    id: 'openai',
    displayName: 'OpenAI',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyPlaceholder: 'sk-proj-...',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', context: '128k' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', context: '128k' },
    ],
  },
  {
    id: 'anthropic',
    displayName: 'Anthropic (Claude)',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyPlaceholder: 'sk-ant-...',
    models: [
      { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', context: '200k' },
      { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', context: '200k' },
    ],
  },
  {
    id: 'gemini',
    displayName: 'Google Gemini',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    keyPlaceholder: 'AIzaSy...',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', context: '1M' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', context: '2M' },
    ],
  },
  {
    id: 'groq',
    displayName: 'Groq',
    keyUrl: 'https://console.groq.com/keys',
    keyPlaceholder: 'gsk_...',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', context: '128k' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', context: '32k' },
    ],
  },
  {
    id: 'deepseek',
    displayName: 'DeepSeek',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    keyPlaceholder: 'sk-...',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3 Chat', context: '128k' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1 Reasoner', context: '128k' },
    ],
  },
  {
    id: 'fireworks',
    displayName: 'Fireworks AI',
    keyUrl: 'https://fireworks.ai/api-keys',
    keyPlaceholder: 'fw_...',
    models: [
      { id: 'accounts/fireworks/models/llama-v3p3-70b-instruct', name: 'Llama 3.3 70B', context: '128k' },
      { id: 'accounts/fireworks/models/mixtral-8x22b-instruct', name: 'Mixtral 8x22B', context: '64k' },
    ],
  },
  {
    id: 'together',
    displayName: 'Together AI',
    keyUrl: 'https://api.together.xyz/settings/api-keys',
    keyPlaceholder: '...',
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Turbo', context: '128k' },
      { id: 'Qwen/Qwen2.5-72B-Instruct-Turbo', name: 'Qwen 2.5 72B Turbo', context: '32k' },
    ],
  },
  {
    id: 'minimax',
    displayName: 'MiniMax',
    keyUrl: 'https://platform.minimaxi.com/user-center/basic-information',
    keyPlaceholder: '...',
    models: [
      { id: 'MiniMax-Text-01', name: 'MiniMax Text-01', context: '1M' },
      { id: 'minimax-m2', name: 'MiniMax M2', context: '128k' },
    ],
  },
  {
    id: 'mistral',
    displayName: 'Mistral AI',
    keyUrl: 'https://console.mistral.ai/api-keys',
    keyPlaceholder: '...',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large', context: '128k' },
      { id: 'mistral-small-latest', name: 'Mistral Small', context: '32k' },
    ],
  },
  {
    id: 'perplexity',
    displayName: 'Perplexity',
    keyUrl: 'https://www.perplexity.ai/settings/api',
    keyPlaceholder: 'pplx-...',
    models: [
      { id: 'llama-3.1-sonar-large-128k-online', name: 'Sonar Large Online', context: '128k' },
      { id: 'llama-3.1-sonar-huge-128k-online', name: 'Sonar Huge Online', context: '128k' },
    ],
  },
  {
    id: 'cohere',
    displayName: 'Cohere',
    keyUrl: 'https://dashboard.cohere.com/api-keys',
    keyPlaceholder: '...',
    models: [
      { id: 'command-r-plus', name: 'Command R+', context: '128k' },
      { id: 'command-r', name: 'Command R', context: '128k' },
    ],
  },
  {
    id: 'xai',
    displayName: 'xAI (Grok)',
    keyUrl: 'https://console.x.ai/team/api-keys',
    keyPlaceholder: 'xai-...',
    models: [
      { id: 'grok-2-latest', name: 'Grok 2', context: '131k' },
      { id: 'grok-beta', name: 'Grok Beta', context: '131k' },
    ],
  },
];

export interface WriteEngineSelection {
  provider: string;
  model: string;
}

const LS_KEY = 'writely_write_engine';

export function getWriteEngineSelection(): WriteEngineSelection {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WriteEngineSelection;
      if (parsed.provider && parsed.model) return parsed;
    }
  } catch {}
  return { provider: 'openrouter', model: 'openrouter/auto' };
}

export function setWriteEngineSelection(sel: WriteEngineSelection) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(sel));
  } catch {}
}
