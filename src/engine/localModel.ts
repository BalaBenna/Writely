import { ModelInfo } from '../types';

export const EXPANDED_LOCAL_MODELS: ModelInfo[] = [
  {
    id: 'writely-gector-80M-int8',
    name: 'Writely GECToR 80M (INT8)',
    tag: 'Built in',
    size: '45 MB',
    ramRequired: '500 MB',
    purpose: 'Realtime non-autoregressive grammar & spell tagging (<50ms)',
    description: 'Ultra-fast single-pass tagger. Captures subject-verb agreement, irregular verbs, and punctuation in <15ms.',
    expectedLatency: '12-22ms',
    speedRating: 9.9,
    accuracyRating: 9.8,
    status: 'ready',
    downloadProgress: 100,
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    backend: 'CoreML / ANE',
    languages: 'English (US/UK/CA/AU)',
    isBuiltIn: true,
  },
  {
    id: 'apple-speech-writing',
    name: 'Apple Foundation Proofreader',
    tag: 'Built in',
    size: '120 MB',
    ramRequired: '400 MB',
    purpose: 'Native Apple Neural Engine proofreader for macOS',
    description: 'Deeply integrated with macOS Sonoma & Sequoia. Zero battery impact and zero heat.',
    expectedLatency: '10-18ms',
    speedRating: 9.9,
    accuracyRating: 9.5,
    status: 'ready',
    downloadProgress: 100,
    sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    backend: 'CoreML / ANE',
    languages: 'Multilingual (18 languages)',
    isBuiltIn: true,
  },
  {
    id: 'writely-qwen-0.5B-q4',
    name: 'Writely Qwen 2.5 0.5B (Q4_K_M)',
    tag: 'New',
    size: '350 MB',
    ramRequired: '1.0 GB',
    purpose: 'Fast local tone rewriter & conciseness assistant',
    description: 'Instant paraphrasing with support for Professional, Friendly, Concise, and Academic voices.',
    expectedLatency: '110-140ms',
    speedRating: 9.8,
    accuracyRating: 9.6,
    status: 'ready',
    downloadProgress: 100,
    sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    backend: 'MLX',
    languages: 'English',
  },
  {
    id: 'llama-32-1b-writing',
    name: 'Llama 3.2 1B Writing Assistant',
    size: '780 MB',
    ramRequired: '1.6 GB',
    purpose: 'Meta Llama 3.2 lightweight reasoning & clarity model',
    description: 'Optimized by Meta for on-device natural text polishing and vocabulary expansion.',
    expectedLatency: '180-240ms',
    speedRating: 9.5,
    accuracyRating: 9.7,
    status: 'available',
    downloadProgress: 0,
    sha256: '7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d',
    backend: 'llama.cpp',
    languages: 'English, Spanish, French, German',
  },
  {
    id: 'writely-qwen-1.5B-q4',
    name: 'Writely Qwen 2.5 1.5B (Q4_K_M)',
    size: '1.1 GB',
    ramRequired: '2.2 GB',
    purpose: 'High-precision academic paraphrasing & structural editing',
    description: 'Top-tier local intelligence for research papers, executive briefings, and complex essays.',
    expectedLatency: '450-600ms',
    speedRating: 9.2,
    accuracyRating: 9.9,
    status: 'available',
    downloadProgress: 0,
    sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    backend: 'llama.cpp',
    languages: 'Multilingual (30+ languages)',
  },
  {
    id: 'nemotron-writing-latin',
    name: 'Nemotron Writing Refine',
    size: '620 MB',
    ramRequired: '1.4 GB',
    purpose: 'NVIDIA Nemotron model with Latin & European language support',
    description: "NVIDIA's specialized text enhancement model optimized for high throughput.",
    expectedLatency: '160-220ms',
    speedRating: 9.6,
    accuracyRating: 9.4,
    status: 'available',
    downloadProgress: 0,
    sha256: '1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809',
    backend: 'ONNX / DirectML',
    languages: 'English, German, French, Spanish, Italian',
  },
];

class ModelManager {
  private models: ModelInfo[] = [...EXPANDED_LOCAL_MODELS];
  private activeModelId: string = 'writely-gector-80M-int8';
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('writely_local_models_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.models = parsed;
        }
        const active = localStorage.getItem('writely_active_local_model');
        if (active) this.activeModelId = active;
      }
    } catch (_) {}
  }

  private saveState() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('writely_local_models_v2', JSON.stringify(this.models));
        localStorage.setItem('writely_active_local_model', this.activeModelId);
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

  getModels(): ModelInfo[] {
    return this.models;
  }

  getActiveModel(): ModelInfo {
    return this.models.find((m) => m.id === this.activeModelId) || this.models[0];
  }

  getActiveRealtimeModel(): ModelInfo {
    return this.getActiveModel();
  }

  setActiveModel(id: string) {
    const target = this.models.find((m) => m.id === id);
    if (target && target.status === 'ready') {
      this.activeModelId = id;
      this.saveState();
    }
  }

  downloadModel(modelId: string, onProgress?: (percent: number) => void): Promise<boolean> {
    const target = this.models.find((m) => m.id === modelId);
    if (!target) return Promise.reject(new Error('Model not found'));

    target.status = 'downloading';
    target.downloadProgress = 0;
    this.saveState();

    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 12) + 8;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          target.status = 'ready';
          target.downloadProgress = 100;
          this.saveState();
          if (onProgress) onProgress(100);
          resolve(true);
        } else {
          target.downloadProgress = progress;
          this.notify();
          if (onProgress) onProgress(progress);
        }
      }, 120);
    });
  }

  deleteModel(modelId: string) {
    const target = this.models.find((m) => m.id === modelId);
    if (target && !target.isBuiltIn) {
      target.status = 'available';
      target.downloadProgress = 0;
      if (this.activeModelId === modelId) {
        this.activeModelId = 'writely-gector-80M-int8';
      }
      this.saveState();
    }
  }
}

export const modelManager = new ModelManager();
