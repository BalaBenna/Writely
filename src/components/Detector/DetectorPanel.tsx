import React, { useMemo, useState } from 'react';
import { ScanEye, Sparkles } from 'lucide-react';
import { detectAI, humanizeText } from '../../engine/detector';

interface Props { text: string; onApplyHumanized?: (t: string) => void; }

export const DetectorPanel: React.FC<Props> = ({ text, onApplyHumanized }) => {
  const result = useMemo(() => detectAI(text), [text]);
  const [humanized, setHumanized] = useState<string | null>(null);

  const color = result.label === 'likely AI' ? 'text-red-600 bg-red-50 border-red-200' : result.label === 'possibly AI' ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-4">
      <div className="flex items-center gap-2"><ScanEye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /><h2 className="font-bold text-slate-900 dark:text-white">AI Detector + Humanizer</h2><span className="ml-auto text-xs px-2 py-1 rounded-full border bg-slate-50 dark:bg-white/5">offline heuristic</span></div>
      <p className="text-xs text-slate-600 dark:text-slate-400">Heuristic (burstiness, perplexity proxy, AI tells) — 100% local, no cloud. Grammarly’s AI Detector is cloud; this is privacy-first alternative.</p>
      <div className={`p-4 rounded-xl border flex items-center gap-4 ${color} dark:bg-opacity-10`}>
        <div className="text-2xl font-mono font-bold">{result.aiLikelihood}%</div>
        <div><div className="text-sm font-semibold capitalize">{result.label}</div><div className="text-xs opacity-80">{result.signals.slice(0,2).join(' • ')}</div></div>
      </div>
      <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
        {result.signals.map((s, i) => <div key={i}>• {s}</div>)}
      </div>
      {result.humanizeSuggestion && <div className="text-xs p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">{result.humanizeSuggestion}</div>}
      <div className="flex gap-2">
        <button onClick={() => setHumanized(humanizeText(text))} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium flex items-center gap-1.5"><Sparkles className="w-4 h-4" />Humanize draft</button>
        {humanized && <button onClick={() => onApplyHumanized?.(humanized)} className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium">Replace in editor</button>}
      </div>
      {humanized && <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-sm whitespace-pre-wrap">{humanized.slice(0, 800)}</div>}
    </div>
  );
};
