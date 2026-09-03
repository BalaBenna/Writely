import React, { useMemo } from 'react';
import { BarChart3 } from 'lucide-react';

interface Props { text: string; suggestionCount: number; }

export const AnalyticsPanel: React.FC<Props> = ({ text, suggestionCount }) => {
  const stats = useMemo(() => {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10).length || 1;
    const avgWps = words / sentences;
    const chars = text.length;
    const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(Boolean).length : 0;
    return { words, sentences, avgWps: avgWps.toFixed(1), chars, paragraphs };
  }, [text]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-4">
      <div className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /><h2 className="font-bold text-slate-900 dark:text-white">Analytics — Personal, Local Only</h2><span className="ml-auto text-xs px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300">no tracking</span></div>
      <p className="text-xs text-slate-600 dark:text-slate-400">Grammarly’s Analytics is team surveillance. Writely’s is personal — all computed locally from this doc, never uploaded.</p>
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5"><div className="text-[11px] text-slate-500">Words</div><div className="text-lg font-mono font-bold">{stats.words}</div></div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5"><div className="text-[11px] text-slate-500">Sentences</div><div className="text-lg font-mono font-bold">{stats.sentences}</div><div className="text-[11px] text-slate-400">avg {stats.avgWps} w/s</div></div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5"><div className="text-[11px] text-slate-500">Issues</div><div className="text-lg font-mono font-bold">{suggestionCount}</div></div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5"><div className="text-[11px] text-slate-500">Characters</div><div className="text-lg font-mono font-bold">{stats.chars}</div></div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5"><div className="text-[11px] text-slate-500">Paragraphs</div><div className="text-lg font-mono font-bold">{stats.paragraphs}</div></div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5"><div className="text-[11px] text-slate-500">Density</div><div className="text-lg font-mono font-bold">{(suggestionCount / Math.max(1, stats.words) * 100).toFixed(1)}%</div><div className="text-[11px] text-slate-400">issues/word</div></div>
      </div>
      <div className="text-[11px] text-slate-500">Trend: history length = {(() => { try { return JSON.parse(localStorage.getItem('writely_saved_drafts') || '[]').length } catch { return 0 } })()} drafts saved locally.</div>
    </div>
  );
};
