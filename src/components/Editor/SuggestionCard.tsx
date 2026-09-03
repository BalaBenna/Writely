import React, { useEffect } from 'react';
import { Trash2, BookPlus, Sparkles, Feather, ArrowRight, Check } from 'lucide-react';
import { Suggestion } from '../../types';

interface SuggestionCardProps {
  suggestion: Suggestion;
  currentIndex: number;
  totalCount: number;
  onAccept: (suggestion: Suggestion) => void;
  onDismiss: (suggestion: Suggestion) => void;
  onAddToDictionary?: (word: string) => void;
  position: { top: number; left: number };
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAccept,
  onDismiss,
  onAddToDictionary,
  position,
  onMouseEnter,
  onMouseLeave,
}) => {
  // Keyboard shortcut: Cmd+Enter to accept, Esc to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        onAccept(suggestion);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss(suggestion);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [suggestion, onAccept, onDismiss]);

  // Determine if this is a single-word fix (Image 1 style) or sentence/clarity rewrite (Image 2 style)
  const isWordCheck =
    !suggestion.original.trim().includes(' ') &&
    !suggestion.replacement.trim().includes(' ') &&
    suggestion.type !== 'clarity';

  // Category title mapping matching Grammarly (e.g. "Use the right word")
  const getCategoryTitle = () => {
    if (suggestion.ruleId.startsWith('CONFUSED_')) return 'Use the right word';
    if (suggestion.ruleId.startsWith('SVA_')) return 'Subject-verb agreement';
    if (suggestion.ruleId.startsWith('SPELL_')) return 'Correct your spelling';
    if (suggestion.ruleId.startsWith('CAPITALIZATION')) return 'Capitalize word';
    if (suggestion.ruleId.startsWith('DOUBLE_PAST')) return 'Avoid double past tense';
    if (suggestion.ruleId.startsWith('CONCISE_')) return 'Improve your text';
    if (suggestion.type === 'clarity') return 'Improve your text';
    if (suggestion.type === 'tone') return 'Tone adjustment';
    return 'Grammar correction';
  };

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        top: `${position.top}px`,
        left: `${Math.max(16, Math.min(position.left, window.innerWidth - 380))}px`,
      }}
      className="absolute z-50 rounded-2xl glass-dropdown shadow-2xl border border-slate-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-100 select-none pointer-events-auto transition-colors"
    >
      {/* CASE 1: WORD-LEVEL CHECK (Matching Grammarly Screenshot 1) */}
      {isWordCheck ? (
        <div className="w-64 p-3.5 space-y-2.5">
          {/* Header Label: e.g. "Use the right word" */}
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {getCategoryTitle()}
          </div>

          {/* Big Bold Replacement Word (Clickable to accept) */}
          <div>
            <button
              onClick={() => onAccept(suggestion)}
              className="group flex items-center space-x-1.5 text-left text-lg font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              title="Click to apply replacement (Cmd+Enter)"
            >
              <span className="group-hover:underline underline-offset-4 decoration-2">
                {suggestion.replacement}
              </span>
              <Check className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 dark:text-emerald-400" />
            </button>
          </div>

          {/* Actions List */}
          <div className="space-y-1 pt-1 border-t border-slate-200/80 dark:border-white/10 text-xs">
            {/* Dismiss button matching Image 1 */}
            <button
              onClick={() => onDismiss(suggestion)}
              className="w-full flex items-center space-x-2 py-1 px-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Dismiss</span>
            </button>

            {/* Add to Dictionary if spelling */}
            {suggestion.type === 'spelling' && onAddToDictionary && (
              <button
                onClick={() => onAddToDictionary(suggestion.original)}
                className="w-full flex items-center space-x-2 py-1 px-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-indigo-300 dark:hover:bg-white/5 transition-colors"
              >
                <BookPlus className="w-3.5 h-3.5 text-slate-400" />
                <span>Add to Dictionary</span>
              </button>
            )}
          </div>

          {/* Footer: "Writely Local AI • 100% Free" */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
              <Feather className="w-3.5 h-3.5" />
              <span>Writely Free & Offline</span>
            </div>
            <kbd className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300">
              ⌘↵
            </kbd>
          </div>
        </div>
      ) : (
        /* CASE 2: SENTENCE / PHRASING REWRITE CARD (Matching Grammarly Screenshot 2) */
        <div className="w-80 sm:w-96 p-4 space-y-3">
          {/* Top Banner: Free & Local AI indicator contrasting Grammarly's paywall */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Local AI Suggestion • 100% Free</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold">
              &lt;15ms
            </span>
          </div>

          {/* Title: "Improve your text" */}
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {getCategoryTitle()}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {suggestion.explanation}
            </p>
          </div>

          {/* Diff Box: Before -> After */}
          <div className="bg-slate-100 dark:bg-slate-900/80 rounded-xl p-3 border border-slate-200 dark:border-white/5 space-y-1.5 font-mono text-xs">
            <div className="text-red-600 dark:text-red-400 line-through decoration-red-500/60 decoration-2">
              - {suggestion.original}
            </div>
            <div className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-100/60 dark:bg-emerald-500/10 p-1.5 rounded border border-emerald-300/50 dark:border-emerald-500/20">
              + {suggestion.replacement}
            </div>
          </div>

          {/* Bottom Actions: Prominent Accept Pill + Dismiss */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => onDismiss(suggestion)}
              className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Dismiss</span>
            </button>

            <button
              onClick={() => onAccept(suggestion)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all active:scale-95"
            >
              <span>Accept Rewrite</span>
              <kbd className="text-[9px] font-mono bg-blue-700/80 px-1 py-0.5 rounded text-blue-100">
                ⌘↵
              </kbd>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
