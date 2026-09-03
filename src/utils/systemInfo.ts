export interface SystemInfo {
  platform: 'mac' | 'windows' | 'linux' | 'web';
  isElectron: boolean;
  ramGB: number | null; // null if undetectable
  cpuCores: number | null;
  deviceMemoryGB: number | null; // navigator.deviceMemory
  diskFreeGB: number | null;
  diskQuotaGB: number | null;
  gpuHint: string | null;
  isAppleSilicon: boolean | null;
}

export async function detectSystemInfo(): Promise<SystemInfo> {
  const isElectron = typeof window !== 'undefined' && (window as any).writely?.isElectron === true;
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const platformRaw = (navigator as any)?.userAgentData?.platform?.toLowerCase() || (typeof navigator !== 'undefined' ? (navigator.platform || '').toLowerCase() : '');

  let platform: SystemInfo['platform'] = 'web';
  if (platformRaw.includes('mac') || ua.includes('mac')) platform = 'mac';
  else if (platformRaw.includes('win') || ua.includes('win')) platform = 'windows';
  else if (platformRaw.includes('linux') || ua.includes('linux')) platform = 'linux';

  // RAM via deviceMemory (Chrome, 0.25-8) or Electron os.totalmem
  let ramGB: number | null = null;
  let deviceMemoryGB: number | null = null;
  try {
    const dm = (navigator as any)?.deviceMemory;
    if (typeof dm === 'number') {
      deviceMemoryGB = dm;
      ramGB = dm;
    }
  } catch {}

  // Try Electron node os
  try {
    if (isElectron && (window as any).writely?.getSystemInfo) {
      const extra = await (window as any).writely.getSystemInfo();
      if (extra?.ramGB) ramGB = extra.ramGB;
      if (extra?.cpuCores) {}
    }
  } catch {}

  // Fallback: try to estimate via performance memory (Chrome)
  if (ramGB === null) {
    try {
      const perfMem = (performance as any)?.memory?.jsHeapSizeLimit;
      if (typeof perfMem === 'number' && perfMem > 0) {
        // heuristic: heap limit ~ 1/4 RAM on Chrome
        const est = Math.round(perfMem / 1024 / 1024 / 1024 * 4);
        if (est >= 2 && est <= 64) ramGB = est;
      }
    } catch {}
  }

  const cpuCores = typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : null;

  let diskFreeGB: number | null = null;
  let diskQuotaGB: number | null = null;
  try {
    if (typeof navigator !== 'undefined' && (navigator as any).storage?.estimate) {
      const est = await (navigator as any).storage.estimate();
      if (typeof est.quota === 'number') diskQuotaGB = +(est.quota / 1024 / 1024 / 1024).toFixed(1);
      if (typeof est.usage === 'number' && typeof est.quota === 'number') diskFreeGB = +((est.quota - est.usage) / 1024 / 1024 / 1024).toFixed(1);
    }
  } catch {}

  // GPU hint
  let gpuHint: string | null = null;
  try {
    const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    const gl = canvas?.getContext('webgl') as any;
    const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      if (typeof renderer === 'string') gpuHint = renderer;
    }
  } catch {}

  const isAppleSilicon = platform === 'mac' && gpuHint ? /apple/i.test(gpuHint) : null;

  return { platform, isElectron, ramGB, cpuCores, deviceMemoryGB, diskFreeGB, diskQuotaGB, gpuHint, isAppleSilicon };
}

export function getRecommendedModelId(sys: SystemInfo, availableIds: string[]): string | null {
  // Choose based on RAM
  const ram = sys.ramGB ?? sys.deviceMemoryGB ?? 8; // default assume 8GB if unknown
  if (ram <= 4) return availableIds.includes('qwen3-4b') ? 'qwen3-4b' : availableIds.includes('writely-gector-80M-int8') ? 'writely-gector-80M-int8' : availableIds[0] || null;
  if (ram <= 8) return availableIds.includes('qwen3-8b') ? 'qwen3-8b' : availableIds.includes('writely-qwen-0.5B-q4') ? 'writely-qwen-0.5B-q4' : availableIds[0] || null;
  if (ram <= 16) return availableIds.includes('qwen3-8b') ? 'qwen3-8b' : availableIds.includes('mistral-3-8b') ? 'mistral-3-8b' : availableIds[0] || null;
  return availableIds.includes('qwen3-14b') ? 'qwen3-14b' : availableIds.includes('mistral-3-14b') ? 'mistral-3-14b' : availableIds[0] || null;
}

export function compatibilityForModel(sys: SystemInfo, modelRamRequired: string): { level: 'good' | 'warn' | 'bad'; reason: string } {
  const ram = sys.ramGB ?? sys.deviceMemoryGB;
  if (ram === null) return { level: 'good', reason: 'RAM unknown — assume OK' };
  const need = parseFloat(modelRamRequired); // e.g. "1.0 GB" → 1.0, "500 MB" → 500
  const needGB = modelRamRequired.includes('MB') ? need / 1024 : need;
  if (ram >= needGB + 2) return { level: 'good', reason: `${ram}GB RAM — plenty` };
  if (ram >= needGB) return { level: 'warn', reason: `${ram}GB RAM — tight but OK` };
  return { level: 'bad', reason: `${ram}GB RAM — insufficient (needs ${modelRamRequired})` };
}
