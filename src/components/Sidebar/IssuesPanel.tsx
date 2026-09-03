import React, { useState } from 'react';
import { CheckCircle2, Check, ArrowRight } from 'lucide-react';
import { Suggestion, IssueType } from '../../types';

interface IssuesPanelProps {
  suggestions: Suggestion[];
  onSelectSuggestion: (id: string) => void;
  onAcceptSuggestion: (suggestion: Suggestion) => void;
  activeSuggestionId: string | null;
}

export const IssuesPanel: React.FC<IssuesPanelProps> = ({
  suggestions,
  onSelectSuggestion,
  onAcceptSuggestion,
  activeSuggestionId,
}) => {
  const [filter, setFilter] = useState<'all' | IssueType>('all');

  const counts = {
    grammar: suggestions.filter((s) => s.type === 'grammar').length,
    spelling: suggestions.filter((s) => s.type === 'spelling').length,
    clarity: suggestions.filter((s) => s.type === 'clarity').length,
    tone: suggestions.filter((s) => s.type === 'tone').length,
  };

  const filtered = suggestions.filter((s) => (filter === 'all' ? true : s.type === filter));

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-xl transition-colors duration-200">
      {/* Header */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Suggestions</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
              {suggestions.length}
            </span>
          </h2>
          {suggestions.length === 0 && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>All clear</span>
            </span>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-white/5 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            All ({suggestions.length})
          </button>
          <button
            onClick={() => setFilter('grammar')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              filter === 'grammar'
                ? 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-white/5 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Grammar ({counts.grammar})
          </button>
          <button
            onClick={() => setFilter('spelling')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              filter === 'spelling'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-white/5 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Spelling ({counts.spelling})
          </button>
          <button
            onClick={() => setFilter('clarity')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              filter === 'clarity'
                ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-white/5 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Clarity ({counts.clarity})
          </button>
        </div>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400/80 mb-2" />
            <div className="text-sm font-medium text-slate-800 dark:text-slate-300">No issues found</div>
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              Your writing looks clean, crisp, and grammatically sound.
            </div>
          </div>
        ) : (
          filtered.map((s) => {
            const isActive = s.id === activeSuggestionId;
            const badgeClass = {
              grammar: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
              spelling: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
              clarity: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
              tone: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
            }[s.type];

            return (
              <div
                key={s.id}
                onClick={() => onSelectSuggestion(s.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50/70 border-indigo-400 shadow-sm dark:bg-indigo-950/40 dark:border-indigo-500/50'
                    : 'bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-white/5 dark:hover:border-white/15 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeClass}`}
                  >
                    {s.type}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAcceptSuggestion(s);
                    }}
                    className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs flex items-center gap-1 transition-colors"
                    title="Accept this fix"
                  >
                    <Check className="w-3 h-3" />
                    <span className="text-[10px] font-medium pr-0.5">Accept</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono mb-1">
                  <span className="text-red-600 dark:text-red-400/90 line-through truncate max-w-[120px]">
                    {s.original}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold truncate max-w-[120px]">
                    {s.replacement}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {s.explanation}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
