import React, { useEffect } from 'react';
import { Trash2, Feather } from 'lucide-react';
import { Suggestion } from '../../types';

interface SuggestionCardProps {
  suggestion: Suggestion;
  currentIndex: number;
  totalCount: number;
  onAccept: (suggestion: Suggestion) => void;
  onDismiss: (suggestion: Suggestion) => void;
  onAddToDictionary?: (word: string) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

// Single-word fix (image 1 style) vs sentence rewrite (image 2 style)
export function isWordSuggestion(s: Suggestion): boolean {
  return (
    !s.original.trim().includes(' ') &&
    !s.replacement.trim().includes(' ') &&
    s.type !== 'clarity'
  );
}

type DiffPart = { t: string; k: 'same' | 'del' | 'add' };

// Word-level diff (LCS): removals render red + struck, additions blue.
export function diffWords(a: string, b: string): DiffPart[] {
  const aw = a.split(/(\s+)/).filter((s) => s.length > 0);
  const bw = b.split(/(\s+)/).filter((s) => s.length > 0);
  const n = aw.length;
  const m = bw.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = aw[i] === bw[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const parts: DiffPart[] = [];
  let i = 0;
  let j = 0;
  const push = (t: string, k: DiffPart['k']) => {
    const last = parts[parts.length - 1];
    if (last && last.k === k) last.t += t;
    else parts.push({ t, k });
  };
  while (i < n && j < m) {
    if (aw[i] === bw[j]) {
      push(aw[i], 'same');
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push(aw[i], 'del');
      i++;
    } else {
      push(bw[j], 'add');
      j++;
    }
  }
  while (i < n) push(aw[i++], 'del');
  while (j < m) push(bw[j++], 'add');
  // Breathing room: a space between adjacent removal/addition runs
  // so red and blue never touch (e.g. "don't doesn't" → "don't doesn't").
  const spaced: DiffPart[] = [];
  for (const p of parts) {
    const prev = spaced[spaced.length - 1];
    if (
      prev &&
      ((prev.k === 'del' && p.k === 'add') || (prev.k === 'add' && p.k === 'del')) &&
      !/\s$/.test(prev.t) &&
      !/^\s/.test(p.t)
    ) {
      spaced.push({ t: ' ', k: 'same' });
    }
    const last = spaced[spaced.length - 1];
    if (last && last.k === p.k) last.t += p.t;
    else spaced.push({ ...p });
  }
  return spaced;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAccept,
  onDismiss,
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

  const word = isWordSuggestion(suggestion);
  const parts = diffWords(suggestion.original, suggestion.replacement);

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`${
        word ? 'w-60' : 'w-80 sm:w-[380px]'
      } rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 shadow-2xl animate-in fade-in zoom-in-95 duration-100 select-none pointer-events-auto overflow-hidden`}
    >
      {/* Rule line */}
      <div className="px-3.5 pt-3 text-[13px] text-slate-500 dark:text-slate-400 leading-snug">
        {suggestion.explanation}
      </div>

      {/* Diff: removals red + struck, additions blue */}
      <button
        onClick={() => onAccept(suggestion)}
        className="block w-full text-left px-3.5 py-2 text-[15px] leading-relaxed hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
        title="Click to apply (⌘↵)"
      >
        {parts.map((p, idx) =>
          p.k === 'del' ? (
            <span key={idx} className="text-red-600 dark:text-red-400 line-through decoration-red-500 decoration-2">
              {p.t}
            </span>
          ) : p.k === 'add' ? (
            <span key={idx} className="text-blue-700 dark:text-blue-400 font-semibold">
              {p.t}
            </span>
          ) : (
            <span key={idx} className="text-slate-800 dark:text-slate-200">
              {p.t}
            </span>
          )
        )}
      </button>

      {/* Dismiss */}
      <div className="px-2 pb-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(suggestion);
          }}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors"
        >
          <Trash2 className="w-4 h-4 text-slate-400" />
          <span>Dismiss</span>
        </button>
      </div>

      {/* Footer */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(suggestion);
        }}
        className="w-full flex items-center gap-2 px-3.5 py-2 border-t border-slate-200 dark:border-white/10 text-[13px] text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors"
      >
        <Feather className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span>
          See more in <strong>Writely</strong>
        </span>
      </button>
    </div>
  );
};
