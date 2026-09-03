export type IssueType = 'grammar' | 'spelling' | 'clarity' | 'tone';

export type Audience = 'general' | 'knowledgeable' | 'expert';
export type Formality = 'informal' | 'neutral' | 'formal';
export type Domain = 'general' | 'academic' | 'business' | 'email' | 'casual' | 'creative';
export type Intent = 'inform' | 'describe' | 'convince' | 'tellStory';

export interface WritingGoals {
  audience: Audience;
  formality: Formality;
  domain: Domain;
  intent: Intent;
}

export const DEFAULT_GOALS: WritingGoals = {
  audience: 'general',
  formality: 'neutral',
  domain: 'general',
  intent: 'inform',
};

export interface ToneAnalysis {
  overall: 'formal' | 'neutral' | 'informal' | 'confident' | 'friendly';
  scores: Record<string, number>;
  emoji: string;
  description: string;
}

export interface Suggestion {
  id: string;
  type: IssueType;
  original: string;
  replacement: string;
  explanation: string;
  start: number;
  end: number;
  sentenceIndex: number;
  ruleId: string;
  confidence?: number;
}

export interface DocumentMetrics {
  wordCount: number;
  charCount: number;
  charCountNoSpaces: number;
  paragraphCount: number;
  sentenceCount: number;
  readingTimeMin: number;
  readabilityScore: number;
  gradeLevel: string;
  clarityScore: number;
  avgWordsPerSentence: number;
  longestSentenceWords: number;
}

export interface EngineTelemetry {
  lastLatencyMs: number;
  tokenizerMs: number;
  engineMs: number;
  cacheHit: boolean;
  activeModel: string;
  timestamp: number;
  tone?: ToneAnalysis;
}

export interface ModelInfo {
  id: string;
  name: string;
  tag?: string; // e.g. "New", "Built-in", "Recommended"
  size: string;
  ramRequired: string;
  purpose: string;
  expectedLatency: string;
  speedRating: number; // 0 to 10 e.g. 9.9
  accuracyRating: number; // 0 to 10 e.g. 9.5
  status: 'ready' | 'downloading' | 'available';
  downloadProgress: number;
  sha256: string;
  backend: 'CoreML / ANE' | 'ONNX / DirectML' | 'llama.cpp' | 'MLX';
  description?: string;
  languages?: string;
  isBuiltIn?: boolean;
}

export type CloudProviderId = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'ollama';

export interface CloudModelInfo {
  id: string;
  provider: CloudProviderId;
  name: string;
  modelId: string;
  description: string;
  contextWindow: string;
  speedRating: number;
  accuracyRating: number;
  isConfigured: boolean;
}

export interface CustomEndpointConfig {
  name: string;
  baseUrl: string;
  modelName: string;
  apiKey?: string;
  enabled: boolean;
}

export type ToneStyle = 'professional' | 'friendly' | 'concise' | 'academic' | 'casual';

export interface RewriteResult {
  tone: ToneStyle;
  original: string;
  rewritten: string;
  explanation: string;
  latencyMs: number;
  providerUsed?: string;
}

export interface SavedDraft {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  wordCount: number;
}
