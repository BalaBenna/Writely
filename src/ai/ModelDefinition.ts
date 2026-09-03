export type ModelTier = 'fast' | 'balanced' | 'quality';

export interface ModelManifest {
  id: string;
  version: string;
  displayName: string;
  sizeBytes: number;
  quantization: string; // e.g. Q4_K_M
  downloadUrl: string;
  sha256: string;
  minRamGB: number;
  tier: ModelTier;
  capabilities: { grammar: boolean; rewrite: boolean; multilingual: boolean };
  license: string; // Apache-2.0 etc.
  commercialUse: boolean;
  backend: 'llama.cpp' | 'CoreML / ANE' | 'ONNX / DirectML';
}

// Re-export ModelInfo tier mapping helper
export function manifestToModelInfo(m: ModelManifest): import('../types').ModelInfo {
  return {
    id: m.id,
    name: m.displayName,
    size: `${(m.sizeBytes / 1024 / 1024 / 1024).toFixed(1)} GB`,
    ramRequired: `${m.minRamGB} GB`,
    purpose: m.capabilities.grammar && m.capabilities.rewrite ? 'Grammar + rewriting' : m.capabilities.grammar ? 'Grammar' : 'Rewrite',
    expectedLatency: m.tier === 'fast' ? '25-45ms' : m.tier === 'balanced' ? '60-110ms' : '150-280ms',
    speedRating: m.tier === 'fast' ? 9.7 : m.tier === 'balanced' ? 9.4 : 8.9,
    accuracyRating: m.tier === 'fast' ? 9.4 : m.tier === 'balanced' ? 9.8 : 9.9,
    status: 'available',
    downloadProgress: 0,
    sha256: m.sha256,
    backend: m.backend,
  } as any;
}
