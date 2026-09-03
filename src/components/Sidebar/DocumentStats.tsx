import React from 'react';
import { BookOpen, Gauge, FileText, Clock, Sparkles } from 'lucide-react';
import { DocumentMetrics } from '../../types';

interface DocumentStatsProps {
  metrics: DocumentMetrics;
}

export const DocumentStats: React.FC<DocumentStatsProps> = ({ metrics }) => {
  // Determine color for readability score
  const getReadabilityColor = (score: number) => {
    if (score >= 70)
      return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20';
    if (score >= 50)
      return 'text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20';
    return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20';
  };

  return (
    <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-white/10 p-4 shadow-sm dark:shadow-xl space-y-4 transition-colors duration-200">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/5">
        <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Document Analytics</span>
        </h3>
        <span className="text-[10px] text-slate-500">Live</span>
      </div>

      {/* Readability Score Card */}
      <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-3 border border-slate-200 dark:border-white/5 flex items-center justify-between">
        <div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Readability Score</div>
          <div className="text-xs font-medium text-slate-900 dark:text-slate-200 mt-0.5">
            {metrics.gradeLevel}
          </div>
        </div>
        <div
          className={`px-3 py-1.5 rounded-xl border text-base font-mono font-bold ${getReadabilityColor(
            metrics.readabilityScore
          )}`}
        >
          {metrics.readabilityScore}/100
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <FileText className="w-3 h-3 text-slate-400" /> Words
          </div>
          <div className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-200 mt-0.5">
            {metrics.wordCount}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
          <div className="text-[10px] text-slate-500 dark:text-slate-400">Characters</div>
          <div className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-200 mt-0.5">
            {metrics.charCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400">{metrics.charCountNoSpaces.toLocaleString()} w/o spaces</div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-slate-400" /> Paragraphs
          </div>
          <div className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-200 mt-0.5">
            {metrics.paragraphCount}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-slate-400" /> Sentences
          </div>
          <div className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-200 mt-0.5">
            {metrics.sentenceCount}
          </div>
          <div className="text-[10px] text-slate-400">avg {metrics.avgWordsPerSentence} w/s</div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" /> Read Time
          </div>
          <div className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-200 mt-0.5">
            ~{metrics.readingTimeMin} min
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-slate-400" /> Clarity
          </div>
          <div className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-300 mt-0.5">
            {metrics.clarityScore}%
          </div>
          {metrics.longestSentenceWords > 25 && <div className="text-[10px] text-amber-600 dark:text-amber-400">longest {metrics.longestSentenceWords}w — split?</div>}
        </div>
      </div>
    </div>
  );
};
