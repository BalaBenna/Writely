import { Suggestion } from '../types';

/**
 * 64-bit FNV-1a Hash Implementation for ultra-fast sentence hashing (<0.01ms)
 */
export function hashSentence(str: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x41c64e6d;

  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch;
    h2 = Math.imul(h2, 0x01000193);
  }

  return (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16);
}

export interface CachedSentence {
  hash: string;
  text: string;
  suggestions: Suggestion[];
  timestamp: number;
}

export class SentenceHashCache {
  private cache: Map<string, CachedSentence> = new Map();
  private maxEntries: number;
  private hits = 0;
  private misses = 0;

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
  }

  get(text: string): Suggestion[] | null {
    const hash = hashSentence(text);
    const entry = this.cache.get(hash);
    if (entry) {
      this.hits++;
      // Refresh recency
      this.cache.delete(hash);
      this.cache.set(hash, entry);
      return entry.suggestions;
    }
    this.misses++;
    return null;
  }

  set(text: string, suggestions: Suggestion[]): void {
    const hash = hashSentence(text);
    if (this.cache.size >= this.maxEntries) {
      // Evict oldest (first key in map iterator)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(hash, {
      hash,
      text,
      suggestions,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? ((this.hits / total) * 100).toFixed(1) + '%' : '0%',
    };
  }
}

export const globalSentenceCache = new SentenceHashCache();
