import React, { useState } from 'react';
import { X, Sparkles, Check, Copy, Zap, RefreshCw, Cpu } from 'lucide-react';
import { ToneStyle, RewriteResult } from '../../types';
import { rewriteText } from '../../engine/rewriter';
import { cloudManager } from '../../engine/cloudProviders';
import { modelManager } from '../../engine/localModel';

interface RewriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  onApplyRewrite: (rewritten: string) => void;
}

export const RewriteModal: React.FC<RewriteModalProps> = ({
  isOpen,
  onClose,
  originalText,
  onApplyRewrite,
}) => {
  const [selectedTone, setSelectedTone] = useState<ToneStyle>('professional');
  const [engineSource, setEngineSource] = useState<string>('local');
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const cloudModels = cloudManager.getCloudModels();
  const activeLocal = modelManager.getActiveModel();

  if (!isOpen) return null;

  const handleRewrite = async (tone: ToneStyle) => {
    setSelectedTone(tone);
    setIsLoading(true);
    try {
      if (engineSource === 'local') {
        const res = await rewriteText(originalText || 'Please enter text to rewrite.', tone);
        setResult({
          ...res,
          providerUsed: `${activeLocal.name} (On-Device)`,
        });
      } else {
        const res = await cloudManager.executeCloudRewrite(originalText || 'Please enter text to rewrite.', tone, engineSource);
        setResult(res);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.rewritten);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900/95 rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl text-slate-900 dark:text-slate-100 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                AI Tone & Rewrite Studio
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transform voice with on-device local models or your cloud API keys
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Engine Picker Row */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/5 mb-4 text-xs">
          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
            <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Inference Engine:</span>
          </span>

          <select
            value={engineSource}
            onChange={(e) => setEngineSource(e.target.value)}
            className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs outline-none cursor-pointer focus:border-indigo-500 transition-colors"
          >
            <option value="local">Local: {activeLocal.name} (On-Device &lt;120ms)</option>
            {cloudModels.filter((m) => m.isConfigured).map((m) => (
              <option key={m.id} value={m.id}>
                Cloud: {m.name} (via your API Key)
              </option>
            ))}
          </select>
        </div>

        {/* Tone Style Selectors */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Select Tone Style
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'professional', label: 'Professional', desc: 'Executive & formal' },
              { id: 'friendly', label: 'Friendly', desc: 'Warm & polite' },
              { id: 'concise', label: 'Concise', desc: 'Trim the fluff' },
              { id: 'academic', label: 'Academic', desc: 'Scholarly & dense' },
              { id: 'casual', label: 'Casual', desc: 'Relaxed & easy' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleRewrite(item.id as ToneStyle)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedTone === item.id
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="text-xs font-semibold">{item.label}</div>
                <div className={`text-[10px] truncate ${selectedTone === item.id ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Views */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Original Box */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-200 dark:border-white/5 flex flex-col">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Original Text
            </span>
            <div className="flex-1 text-xs font-mono text-slate-800 dark:text-slate-300 leading-relaxed max-h-44 overflow-y-auto pr-1">
              {originalText || (
                <span className="text-slate-400 dark:text-slate-600 italic">No text provided</span>
              )}
            </div>
          </div>

          {/* Rewritten Box */}
          <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-3.5 border border-indigo-200 dark:border-indigo-500/20 flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                Rewritten Output
              </span>
              {result && (
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> {result.latencyMs} ms
                </span>
              )}
            </div>

            <div className="flex-1 text-xs font-mono leading-relaxed max-h-44 overflow-y-auto pr-1">
              {isLoading ? (
                <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 py-6 justify-center">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating rewrite...</span>
                </div>
              ) : result ? (
                <span className="text-emerald-800 dark:text-emerald-300 font-medium">{result.rewritten}</span>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 italic">
                  Choose a tone style above to generate rewrite.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10">
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[320px]">
            {result?.providerUsed ? (
              <span className="text-indigo-700 dark:text-indigo-300 font-mono text-[11px]">
                ⚡ {result.providerUsed}
              </span>
            ) : (
              'Instant processing via chosen engine.'
            )}
          </div>

          <div className="flex items-center space-x-2">
            {result && (
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs transition-colors"
              >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            )}

            <button
              onClick={() => {
                if (result) {
                  onApplyRewrite(result.rewritten);
                  onClose();
                }
              }}
              disabled={!result}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Replace in Editor</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
