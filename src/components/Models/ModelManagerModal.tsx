import React, { useState, useEffect } from 'react';
import { X, Cpu, Download, CheckCircle2, HardDrive, Trash2, ShieldCheck, RefreshCw } from 'lucide-react';
import { ModelInfo } from '../../types';
import { modelManager } from '../../engine/localModel';

interface ModelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelManagerModal: React.FC<ModelManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [models, setModels] = useState<ModelInfo[]>(modelManager.getModels());

  useEffect(() => {
    return modelManager.subscribe(() => {
      setModels([...modelManager.getModels()]);
    });
  }, []);

  if (!isOpen) return null;

  const handleDownload = (id: string) => {
    modelManager.downloadModel(id);
  };

  const handleDelete = (id: string) => {
    modelManager.deleteModel(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl glass-dropdown rounded-2xl p-6 border border-white/10 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Local AI Model Manager
              </h2>
              <p className="text-xs text-slate-400">
                Models run 100% on your device. Zero telemetry, zero cloud calls.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Storage path notice */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5 mb-4 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <span>Local Storage Directory:</span>
            <code className="font-mono text-indigo-300 bg-black/40 px-1.5 py-0.5 rounded">
              ~/.writely/models/
            </code>
          </div>
          <div className="flex items-center space-x-1 text-emerald-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Offline Verified</span>
          </div>
        </div>

        {/* Model Cards */}
        <div className="space-y-3 mb-5 max-h-[380px] overflow-y-auto pr-1">
          {models.map((model) => {
            const isReady = model.status === 'ready';
            const isDownloading = model.status === 'downloading';

            return (
              <div
                key={model.id}
                className="p-4 rounded-xl bg-slate-900/50 border border-white/5 hover:border-white/15 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-sm text-white">
                        {model.name}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {model.backend}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {model.purpose}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-medium text-emerald-400">
                      {model.expectedLatency}
                    </span>
                    <div className="text-[10px] text-slate-500">
                      RAM: {model.ramRequired}
                    </div>
                  </div>
                </div>

                {/* Progress bar if downloading */}
                {isDownloading && (
                  <div className="w-full bg-slate-800 rounded-full h-2 mb-3 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full transition-all duration-150 rounded-full"
                      style={{ width: `${model.downloadProgress}%` }}
                    />
                  </div>
                )}

                {/* Bottom details & action */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <div className="text-slate-400 flex items-center space-x-3">
                    <span>Size: <strong className="text-slate-300">{model.size}</strong></span>
                    <span className="truncate max-w-[150px] font-mono text-[10px] text-slate-500">
                      SHA: {model.sha256.substring(0, 10)}...
                    </span>
                  </div>

                  <div>
                    {isReady ? (
                      <div className="flex items-center space-x-2">
                        <span className="flex items-center space-x-1 text-emerald-400 font-medium text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                        {model.id !== 'writely-gector-80M-int8' && (
                          <button
                            onClick={() => handleDelete(model.id)}
                            className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                            title="Delete model"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : isDownloading ? (
                      <span className="flex items-center space-x-1 text-indigo-400 text-xs">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Downloading {model.downloadProgress}%</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDownload(model.id)}
                        className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-sm transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download ({model.size})</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-slate-400">
          <span>Hugging Face Model Hub: <code className="text-indigo-400">writely-ai/*</code></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
