import React, { useMemo } from 'react';
import { ShieldAlert, ExternalLink } from 'lucide-react';
import { checkPlagiarismLocal, SavedDocForCheck } from '../../engine/plagiarism';

interface Props { currentText: string; corpus: SavedDocForCheck[]; }

export const PlagiarismPanel: React.FC<Props> = ({ currentText, corpus }) => {
  const matches = useMemo(() => checkPlagiarismLocal(currentText, corpus), [currentText, corpus]);
  const maxSim = matches.length ? Math.max(...matches.map(m => m.similarity)) : 0;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <h2 className="font-bold text-slate-900 dark:text-white">Plagiarism — Local Self-Check</h2>
        <span className="ml-auto text-xs px-2 py-1 rounded-full border bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10">{matches.length} matches</span>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400">Offline only — compares against your saved drafts & history (n-gram Jaccard). For web-scale (16B pages), use opt-in cloud: <a href="https://www.grammarly.com/plagiarism-checker" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1">Grammarly/Copyscape <ExternalLink className="w-3 h-3"/></a></p>
      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-mono font-bold text-sm ${maxSim > 40 ? 'bg-red-100 text-red-700 border-red-200' : maxSim > 15 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'} border`}>{maxSim}%</div>
        <div><div className="text-sm font-semibold text-slate-900 dark:text-white">Self-similarity score</div><div className="text-xs text-slate-500">{maxSim === 0 ? 'No overlap — likely original' : maxSim > 40 ? 'High overlap — paraphrase or cite' : 'Low overlap — check flagged passages'}</div></div>
      </div>
      {matches.length === 0 ? (
        <div className="text-xs text-slate-500 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">✓ No self-plagiarism detected in this browser’s history.</div>
      ) : (
        <div className="space-y-2">
          {matches.map(m => (
            <div key={m.sourceId} className="p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/50">
              <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{m.sourceTitle}</span><span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300">{m.similarity}%</span></div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{m.excerpt}</div>
              <div className="text-[11px] text-slate-500 mt-1">overlap: {m.matchedNgrams.slice(0,2).join(' • ')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
