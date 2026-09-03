// IPC bridge: Renderer → Preload → Main → AIManager → llama-server
// Renderer never gets Node/fs/process access.

export interface AI_IPC {
  correct(request: { text: string; before?: string; after?: string; tier?: 'fast' | 'balanced'; sentenceOffset?: number; sentenceIndex?: number }): Promise<import('../types').Suggestion[]>;
  rewrite(request: { text: string; style: string; tier?: 'balanced' | 'quality' }): Promise<string>;
  health(): Promise<{ ok: boolean; models: string[] }>;
}

export const aiIPC: AI_IPC = {
  async correct(req) {
    const api = (window as any).writelyAI;
    if (!api?.correct) throw new Error('writelyAI IPC not available');
    return api.correct(req);
  },
  async rewrite(req) {
    const api = (window as any).writelyAI;
    if (!api?.rewrite) throw new Error('writelyAI IPC not available');
    return api.rewrite(req);
  },
  async health() {
    const api = (window as any).writelyAI;
    if (!api?.health) return { ok: false, models: [] };
    return api.health();
  },
};
