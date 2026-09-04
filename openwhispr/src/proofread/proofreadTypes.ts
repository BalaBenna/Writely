// proofreadTypes - Writely proofreading types, vendored with the proofread engine.

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
