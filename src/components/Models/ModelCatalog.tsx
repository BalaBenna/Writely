import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Cloud,
  Terminal,
  Download,
  CheckCircle2,
  Settings,
  Sparkles,
  ShieldCheck,
  HardDrive,
  Key,
  ExternalLink,
  MoreHorizontal,
  Trash2,
  Play,
  RefreshCw,
  Check,
} from 'lucide-react';
import { ModelInfo, CloudModelInfo, CustomEndpointConfig, CloudProviderId } from '../../types';
import { modelManager } from '../../engine/localModel';
import { cloudManager, PROVIDER_CONFIGS } from '../../engine/cloudProviders';
import { detectSystemInfo, getRecommendedModelId, compatibilityForModel, SystemInfo } from '../../utils/systemInfo';

interface ModelCatalogProps {
  onOpenSettings?: () => void;
}

export const ModelCatalog: React.FC<ModelCatalogProps> = ({ onOpenSettings }) => {
  const [tab, setTab] = useState<'local' | 'cloud' | 'custom'>('local');

  // Local state
  const [localModels, setLocalModels] = useState<ModelInfo[]>(modelManager.getModels());
  const [activeLocalModelId, setActiveLocalModelId] = useState<string>(
    modelManager.getActiveModel().id
  );

  // System info for smart recommendations
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [recommendedId, setRecommendedId] = useState<string | null>(null);
  useEffect(() => {
    detectSystemInfo().then(sys => {
      setSystemInfo(sys);
      const rec = getRecommendedModelId(sys, localModels.map(m => m.id));
      setRecommendedId(rec);
    });
  }, []);

  // Cloud state
  const [cloudModels, setCloudModels] = useState<CloudModelInfo[]>(cloudManager.getCloudModels());
  const [activeCloudModelId, setActiveCloudModelId] = useState<string>(cloudManager.getActiveModelId());
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    (Object.keys(PROVIDER_CONFIGS) as CloudProviderId[]).forEach(p => { o[p] = cloudManager.getApiKey(p); });
    return o;
  });
  const [testStatus, setTestStatus] = useState<Record<string, { loading?: boolean; msg?: string; ok?: boolean }>>({});

  // Custom state
  const [customEndpoint, setCustomEndpoint] = useState<CustomEndpointConfig>(cloudManager.getCustomEndpoint());
  const [customTestStatus, setCustomTestStatus] = useState<{ loading?: boolean; msg?: string; ok?: boolean }>({});

  // Menu popover
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    const unsubLocal = modelManager.subscribe(() => {
      setLocalModels([...modelManager.getModels()]);
      setActiveLocalModelId(modelManager.getActiveModel().id);
    });
    const unsubCloud = cloudManager.subscribe(() => {
      setCloudModels([...cloudManager.getCloudModels()]);
      setActiveCloudModelId(cloudManager.getActiveModelId());
    });
    return () => {
      unsubLocal();
      unsubCloud();
    };
  }, []);

  const handleDownload = (id: string) => {
    const model = localModels.find(m => m.id === id);
    if (model && systemInfo) {
      const compat = compatibilityForModel(systemInfo, model.ramRequired);
      if (compat.level === 'bad') {
        const ok = window.confirm(`⚠️ ${compat.reason}\n\n"${model.name}" needs ${model.ramRequired} RAM but your system has ~${systemInfo.ramGB ?? systemInfo.deviceMemoryGB ?? '?'} GB.\nIt may be slow or fail to load.\n\nDownload anyway?`);
        if (!ok) return;
      } else if (compat.level === 'warn') {
        // soft warn via confirm only for bad; warn just proceeds
      }
      // Disk check
      if (systemInfo.diskFreeGB !== null) {
        const needGB = parseFloat(model.size) * (model.size.includes('MB') ? 1/1024 : 1);
        if (systemInfo.diskFreeGB < needGB + 0.5) {
          const ok2 = window.confirm(`Low disk space: ${systemInfo.diskFreeGB} GB free, need ~${model.size}.\nContinue?`);
          if (!ok2) return;
        }
      }
    }
    modelManager.downloadModel(id);
  };

  const handleSetActive = (id: string) => {
    modelManager.setActiveModel(id);
    setActiveLocalModelId(id);
    setMenuOpenId(null);
  };

  const handleDelete = (id: string) => {
    modelManager.deleteModel(id);
    setMenuOpenId(null);
  };

  const handleSaveApiKey = (provider: CloudProviderId, key: string) => {
    cloudManager.setApiKey(provider, key);
    setApiKeys((prev) => ({ ...prev, [provider]: key }));
  };

  const handleTestCloudConnection = async (provider: CloudProviderId) => {
    setTestStatus((prev) => ({ ...prev, [provider]: { loading: true } }));
    const res = await cloudManager.testConnection(provider);
    setTestStatus((prev) => ({
      ...prev,
      [provider]: { loading: false, msg: res.message, ok: res.success },
    }));
  };

  const handleSaveCustomEndpoint = () => {
    cloudManager.setCustomEndpoint(customEndpoint);
  };

  const handleTestCustomEndpoint = async () => {
    setCustomTestStatus({ loading: true });
    const res = await cloudManager.testCustomEndpoint();
    setCustomTestStatus({ loading: false, msg: res.message, ok: res.success });
  };

  // Render dots for rating
  const renderDots = (rating: number) => {
    const filled = Math.round((rating / 10) * 5);
    return (
      <span className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-mono text-xs">
        {'●'.repeat(filled)}
        <span className="text-slate-300 dark:text-slate-600">{'○'.repeat(5 - filled)}</span>
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-2xl transition-colors duration-200">
      {/* Top Header matching VoiceInk: "Model Catalog" + settings icon */}
      <div className="p-6 pb-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Model Catalog
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Choose on-device local models for zero latency, or connect your own cloud API keys.
            </p>
          </div>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-colors"
              title="Catalog Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Pills: [ Local ] [ Cloud ] [ Custom ] */}
        <div className="inline-flex p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-300/80 dark:border-white/10">
          <button
            onClick={() => setTab('local')}
            className={`flex items-center space-x-2 px-5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === 'local'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Local</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-mono">
              {localModels.length}
            </span>
          </button>

          <button
            onClick={() => setTab('cloud')}
            className={`flex items-center space-x-2 px-5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === 'cloud'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Cloud</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/15 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-mono">
              BYOK
            </span>
          </button>

          <button
            onClick={() => setTab('custom')}
            className={`flex items-center space-x-2 px-5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === 'custom'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Custom</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* TAB 1: LOCAL MODELS */}
        {tab === 'local' && (
          <div className="space-y-3.5 max-w-5xl">
            {/* System-aware header — shows detected hardware + recommendation */}
            {systemInfo ? (
              <div className="p-4 rounded-2xl border bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-slate-900 dark:to-slate-900 border-indigo-200 dark:border-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Your system — auto-detected
                      {systemInfo.isElectron && <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-white dark:bg-white dark:text-slate-900">Electron</span>}
                    </h3>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10">
                        <div className="text-[11px] text-slate-500">Platform</div>
                        <div className="font-semibold capitalize flex items-center gap-1">{systemInfo.platform} {systemInfo.isAppleSilicon ? '• Apple Silicon' : ''}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10">
                        <div className="text-[11px] text-slate-500">RAM</div>
                        <div className="font-semibold font-mono">{systemInfo.ramGB ?? systemInfo.deviceMemoryGB ?? '—'} GB {systemInfo.ramGB === null && systemInfo.deviceMemoryGB === null && <span className="text-[11px] font-normal text-amber-600">(unknown)</span>}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10">
                        <div className="text-[11px] text-slate-500">CPU cores</div>
                        <div className="font-semibold font-mono">{systemInfo.cpuCores ?? '—'}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10">
                        <div className="text-[11px] text-slate-500">Disk free</div>
                        <div className="font-semibold font-mono">{systemInfo.diskFreeGB !== null ? `${systemInfo.diskFreeGB} GB` : systemInfo.diskQuotaGB !== null ? `~${systemInfo.diskQuotaGB} GB quota` : '—'}</div>
                      </div>
                    </div>
                    {systemInfo.gpuHint && <div className="mt-2 text-[11px] text-slate-500 truncate">GPU: {systemInfo.gpuHint}</div>}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[11px] text-slate-500">Recommended for you</div>
                    <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-semibold shadow">
                      <Sparkles className="w-3.5 h-3.5" />
                      {localModels.find(m => m.id === recommendedId)?.name || '—'}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      {(() => {
                        const rec = localModels.find(m => m.id === recommendedId);
                        return rec ? `${rec.size} • ${rec.ramRequired} RAM` : '';
                      })()}
                    </div>
                  </div>
                </div>
                <div className="mt-3 p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 text-xs">
                  <div className="font-semibold mb-1">How to choose — Fast / Balanced / Quality</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                    <div><strong className="text-slate-900 dark:text-white">Fast 3B/4B ~2–3 GB</strong><br />MacBook Air 8GB, Intel Mac, old Win — continuous grammar as you type.</div>
                    <div><strong className="text-slate-900 dark:text-white">Balanced 8B ~5 GB</strong> (default)<br />16GB RAM class — grammar + rewriting, multilingual.</div>
                    <div><strong className="text-slate-900 dark:text-white">Quality 14B ~8–10 GB</strong><br />16GB+ — best rewriting, longer context. Needs RAM.</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 text-xs flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                Detecting your system (RAM, CPU, disk) to recommend the best model…
              </div>
            )}

            {/* Tier headers */}
            <div className="flex items-center gap-2 pt-2">
              <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
              <span className="text-[11px] tracking-widest font-semibold text-slate-500">CHOOSE YOUR AI QUALITY — DOWNLOAD ONCE, RUN OFFLINE</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            </div>

            {localModels.map((model) => {
              const isDownloaded = model.status === 'ready';
              const isDownloading = model.status === 'downloading';
              const isActive = activeLocalModelId === model.id;
              const isRecommended = recommendedId === model.id;
              const compat = systemInfo ? compatibilityForModel(systemInfo, model.ramRequired) : { level: 'good' as const, reason: '' };

              return (
                <div
                  key={model.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-indigo-50/70 border-indigo-500 shadow-sm dark:bg-slate-900/90 dark:border-indigo-500/60 dark:ring-1 dark:ring-indigo-500/30'
                      : isRecommended
                      ? 'bg-amber-50/40 border-amber-400 dark:bg-slate-900/60 dark:border-amber-500/40 dark:ring-1 dark:ring-amber-500/20 hover:border-amber-500'
                      : 'bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-900/50 border-slate-200 dark:border-white/5 dark:hover:border-white/15'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Model Info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {model.name}
                        </h3>
                        {model.tag && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                            {model.tag}
                          </span>
                        )}
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                            Current Engine
                          </span>
                        )}
                        {isRecommended && !isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                            ★ Recommended for your system
                          </span>
                        )}
                        {systemInfo && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${compat.level === 'good' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' : compat.level === 'warn' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20' : 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20'}`} title={compat.reason}>
                            {compat.level === 'good' ? '✓ Compatible' : compat.level === 'warn' ? '⚠ Tight' : '✗ Needs more RAM'}
                          </span>
                        )}
                      </div>

                      {/* Badges metadata row matching Image 1 */}
                      <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-y-1">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>{model.purpose}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>On-Device</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono">{model.size}</span>
                        </span>
                        <span>•</span>
                        <span>RAM: <strong className="text-slate-800 dark:text-slate-300">{model.ramRequired}</strong></span>
                      </div>

                      {/* Speed & Accuracy row */}
                      <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span>Speed:</span>
                          {renderDots(model.speedRating)}
                          <span className="font-mono text-slate-800 dark:text-slate-300 text-[11px] font-medium">{model.speedRating}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span>Accuracy:</span>
                          {renderDots(model.accuracyRating)}
                          <span className="font-mono text-slate-800 dark:text-slate-300 text-[11px] font-medium">{model.accuracyRating}</span>
                        </div>
                      </div>

                      {model.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 pt-1 leading-relaxed">
                          {model.description}
                        </p>
                      )}
                      {systemInfo && compat.level !== 'good' && (
                        <p className={`text-[11px] mt-1 ${compat.level === 'bad' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {compat.reason} • Will download to <code className="font-mono px-1 py-0.5 rounded bg-slate-100 dark:bg-white/5">{`~/.writely/models/${model.id}/model.gguf`}</code> via GGUF + llama.cpp — user manages download once.
                        </p>
                      )}
                      {systemInfo && compat.level === 'good' && model.size.includes('GB') && (
                        <p className="text-[11px] mt-1 text-slate-500">Stored in <code className="font-mono px-1 py-0.5 rounded bg-slate-100 dark:bg-white/5">{`~/.writely/models/${model.id}/`}</code> — GGUF quantized, no API key.</p>
                      )}
                    </div>

                    {/* Right Action Button matching VoiceInk */}
                    <div className="flex items-center space-x-2 shrink-0">
                      {isDownloaded ? (
                        <div className="flex items-center space-x-2">
                          {!isActive ? (
                            <button
                              onClick={() => handleSetActive(model.id)}
                              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/10 shadow-sm transition-colors"
                            >
                              Activate
                            </button>
                          ) : null}

                          <div className="flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-white/10">
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{model.isBuiltIn ? 'Built in' : 'Downloaded'}</span>
                          </div>

                          {!model.isBuiltIn && (
                            <div className="relative">
                              <button
                                onClick={() => setMenuOpenId(menuOpenId === model.id ? null : model.id)}
                                className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {menuOpenId === model.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setMenuOpenId(null)}
                                  />
                                  <div className="absolute right-0 mt-2 w-48 glass-dropdown rounded-xl p-2 z-50 shadow-2xl border border-slate-200 dark:border-white/10 text-xs">
                                    <button
                                      onClick={() => handleSetActive(model.id)}
                                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
                                    >
                                      <Play className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                      <span>Use as Active Model</span>
                                    </button>
                                    <button
                                      onClick={() => handleDelete(model.id)}
                                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete Model</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ) : isDownloading ? (
                        <div className="flex flex-col items-end min-w-[140px]">
                          <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1 font-semibold">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Downloading {model.downloadProgress}%</span>
                          </span>
                          <div className="w-36 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-150"
                              style={{ width: `${model.downloadProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDownload(model.id)}
                          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all active:scale-95"
                        >
                          <span>Download</span>
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: CLOUD MODELS (BYOK - Bring Your Own Key) */}
        {tab === 'cloud' && (
          <div className="space-y-4 max-w-5xl">
            {/* Notice */}
            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/20 text-xs text-indigo-950 dark:text-indigo-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>
                  <strong>Bring Your Own Key (BYOK):</strong> Your API keys are stored locally on this machine in encrypted storage and sent directly to the model provider.
                </span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-200">
              <strong>OpenRouter tip:</strong> One OpenRouter key (sk-or-...) gives access to 200+ models — OpenAI, Claude, Gemini, DeepSeek, Llama — without separate keys. Paste it under OpenRouter below.
            </div>
            {/* Provider Key Inputs — all 14 providers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.entries(PROVIDER_CONFIGS) as [CloudProviderId, typeof PROVIDER_CONFIGS[CloudProviderId]][]).filter(([id]) => id !== 'ollama').map(([id, cfg]) => {
                const status = testStatus[id];
                const isFeatured = ['openrouter','openai','anthropic','gemini','deepseek','groq','together','fireworks','minimax'].includes(id);
                return (
                  <div key={id} className={`p-4 rounded-2xl border space-y-2.5 ${isFeatured ? 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-white/5' : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/70 dark:border-white/5'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">{cfg.displayName} {isFeatured && <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500 text-white font-bold">POPULAR</span>} {apiKeys[id] && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Key saved" />} </span>
                      {cfg.keyUrl && (
                        <a href={cfg.keyUrl} target="_blank" rel="noreferrer" className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"><span>Get Key</span><ExternalLink className="w-3 h-3" /></a>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="password" value={apiKeys[id] || ''} onChange={(e) => handleSaveApiKey(id as CloudProviderId, e.target.value)} placeholder={cfg.keyPlaceholder} className="flex-1 bg-white dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-indigo-500" />
                      <button onClick={() => handleTestCloudConnection(id as CloudProviderId)} disabled={!apiKeys[id] || status?.loading} className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-40 text-xs font-semibold transition-colors">{status?.loading ? 'Testing...' : 'Verify'}</button>
                    </div>
                    {status?.msg && (
                      <div className={`text-[11px] flex items-center gap-1 ${status.ok ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-red-600 dark:text-red-400'}`}>{status.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}<span>{status.msg}</span></div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Cloud Models Catalog */}
            <h3 className="text-sm font-bold text-slate-900 dark:text-white pt-2">Available Cloud Models</h3>
            <div className="space-y-3">
              {cloudModels.map((m) => {
                const isSelected = activeCloudModelId === m.id;
                return (
                  <div
                    key={m.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-500 dark:bg-slate-900/90 dark:border-indigo-500/60 ring-1 ring-indigo-500/20'
                        : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{m.name}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {m.modelId}
                          </span>
                          {m.isConfigured ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-semibold">
                              Configured
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-400">
                              Needs API Key
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{m.description}</p>
                        <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                          <span>Context: <strong className="text-slate-800 dark:text-slate-300">{m.contextWindow}</strong></span>
                          <span>•</span>
                          <span>Speed: {renderDots(m.speedRating)}</span>
                          <span>•</span>
                          <span>Accuracy: {renderDots(m.accuracyRating)}</span>
                        </div>
                      </div>

                      <div>
                        {m.isConfigured ? (
                          <button
                            onClick={() => {
                              cloudManager.setActiveModelId(m.id);
                              setActiveCloudModelId(m.id);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/10'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Use for Rewrites'}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const el = document.querySelector(`input[placeholder*="..."]`) as HTMLElement;
                              el?.focus();
                            }}
                            className="px-3.5 py-1.5 rounded-xl text-xs text-slate-600 dark:text-slate-400 bg-slate-200/70 dark:bg-white/5 hover:bg-slate-200"
                          >
                            Add Key Above
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOM ENDPOINTS (Ollama / vLLM / Localhost) */}
        {tab === 'custom' && (
          <div className="max-w-2xl space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <div className="font-semibold text-slate-900 dark:text-white">Connect Ollama, LM Studio, or vLLM</div>
              <p className="text-slate-500 dark:text-slate-400">
                You can run models like Llama 3.3, Mistral, or Gemma on your local network or GPU server via OpenAI-compatible endpoints.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Server Name
                </label>
                <input
                  type="text"
                  value={customEndpoint.name}
                  onChange={(e) => setCustomEndpoint({ ...customEndpoint, name: e.target.value })}
                  className="w-full bg-white dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Base API URL (OpenAI-Compatible)
                </label>
                <input
                  type="text"
                  value={customEndpoint.baseUrl}
                  onChange={(e) => setCustomEndpoint({ ...customEndpoint, baseUrl: e.target.value })}
                  placeholder="http://localhost:11434/v1"
                  className="w-full bg-white dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Default Ollama URL is <code>http://localhost:11434/v1</code>
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Model Identifier
                </label>
                <input
                  type="text"
                  value={customEndpoint.modelName}
                  onChange={(e) => setCustomEndpoint({ ...customEndpoint, modelName: e.target.value })}
                  placeholder="llama3.2:latest"
                  className="w-full bg-white dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Optional API Key
                </label>
                <input
                  type="password"
                  value={customEndpoint.apiKey || ''}
                  onChange={(e) => setCustomEndpoint({ ...customEndpoint, apiKey: e.target.value })}
                  placeholder="Bearer token (if required)"
                  className="w-full bg-white dark:bg-slate-950 px-3 py-2 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-white/10">
                <button
                  onClick={handleTestCustomEndpoint}
                  disabled={customTestStatus.loading}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-white/10 transition-colors"
                >
                  {customTestStatus.loading ? 'Pinging Server...' : 'Test Connection'}
                </button>

                <button
                  onClick={handleSaveCustomEndpoint}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm transition-all"
                >
                  Save Custom Endpoint
                </button>
              </div>

              {customTestStatus.msg && (
                <div className={`text-xs ${customTestStatus.ok ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-red-600 dark:text-red-400'}`}>
                  {customTestStatus.msg}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
