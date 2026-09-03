import React, { useState } from 'react';
import { X, Settings, Sliders, ShieldCheck, Trash2, CheckCircle2, HelpCircle } from 'lucide-react';
import { globalSentenceCache } from '../../engine/cache';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  debounceMs: number;
  setDebounceMs: (ms: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  debounceMs,
  setDebounceMs,
}) => {
  const [grammarEnabled, setGrammarEnabled] = useState(true);
  const [spellingEnabled, setSpellingEnabled] = useState(true);
  const [clarityEnabled, setClarityEnabled] = useState(true);
  const [cacheCleared, setCacheCleared] = useState(false);

  if (!isOpen) return null;

  const handleClearCache = () => {
    globalSentenceCache.clear();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg glass-dropdown rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 mb-5">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Engine Preferences</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure debounce speed, active rules, and local caching
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

        {/* Debounce Control */}
        <div className="mb-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Typing Debounce Interval:</span>
            </span>
            <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              {debounceMs} ms
            </span>
          </div>

          <input
            type="range"
            min="40"
            max="300"
            step="10"
            value={debounceMs}
            onChange={(e) => setDebounceMs(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>40ms (Instant)</span>
            <span>80ms (Recommended)</span>
            <span>300ms (Relaxed)</span>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2.5 mb-5">
          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 cursor-pointer">
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                Realtime Grammar Checking
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Subject-verb agreement, irregular verbs, commonly confused words
              </div>
            </div>
            <input
              type="checkbox"
              checked={grammarEnabled}
              onChange={(e) => setGrammarEnabled(e.target.checked)}
              className="accent-indigo-600 h-4 w-4 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 cursor-pointer">
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                Fast Spell Checking (&lt;2ms)
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                SymSpell Levenshtein distance check + personal user dictionary
              </div>
            </div>
            <input
              type="checkbox"
              checked={spellingEnabled}
              onChange={(e) => setSpellingEnabled(e.target.checked)}
              className="accent-indigo-600 h-4 w-4 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 cursor-pointer">
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                Clarity & Conciseness
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Eliminate wordiness, tautologies, and bloated filler phrases
              </div>
            </div>
            <input
              type="checkbox"
              checked={clarityEnabled}
              onChange={(e) => setClarityEnabled(e.target.checked)}
              className="accent-indigo-600 h-4 w-4 rounded"
            />
          </label>
        </div>

        {/* Cache stats & clear */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 mb-5">
          <div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-300">Sentence Hash Cache</div>
            <div className="text-[10px] text-slate-500">
              Hits: {globalSentenceCache.getStats().hits} | Hit Rate: {globalSentenceCache.getStats().hitRate}
            </div>
          </div>
          <button
            onClick={handleClearCache}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs transition-colors"
          >
            {cacheCleared ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>{cacheCleared ? 'Cleared' : 'Clear Cache'}</span>
          </button>
        </div>

        {/* Onboarding replay */}
        <div className="mb-4 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <div><div className="text-xs font-semibold">Need a tour?</div><div className="text-[11px] text-slate-600 dark:text-slate-400">Mac vs Windows vs Web setup in 6 steps.</div></div>
          </div>
          <button onClick={() => { try { localStorage.removeItem('writely_onboarded_v2'); } catch {}; window.location.reload(); }} className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-medium hover:bg-slate-50 dark:hover:bg-white/5">Replay Onboarding</button>
        </div>

        {/* Privacy Note & Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-white/10 text-xs">
          <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero Telemetry Guarantee</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
