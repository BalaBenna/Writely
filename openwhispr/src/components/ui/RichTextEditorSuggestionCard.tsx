import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, Trash2, BookPlus, Sparkles, X } from "lucide-react";
import type { Suggestion } from "../../proofread/proofreadTypes";
import { cn } from "../lib/utils";

export interface SuggestionCardProps {
  suggestion: Suggestion;
  anchorRect: DOMRect;
  onAccept: (suggestion: Suggestion) => void;
  onDismiss: (suggestion: Suggestion) => void;
  onAddToDictionary?: (word: string) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function isWordSuggestion(s: Suggestion): boolean {
  return (
    !s.original.trim().includes(" ") &&
    !s.replacement.trim().includes(" ") &&
    s.type !== "clarity"
  );
}

type DiffPart = { t: string; k: "same" | "del" | "add" };

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
  const push = (t: string, k: DiffPart["k"]) => {
    const last = parts[parts.length - 1];
    if (last && last.k === k) last.t += t;
    else parts.push({ t, k });
  };
  while (i < n && j < m) {
    if (aw[i] === bw[j]) {
      push(aw[i], "same");
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      push(aw[i], "del");
      i++;
    } else {
      push(bw[j], "add");
      j++;
    }
  }
  while (i < n) push(aw[i++], "del");
  while (j < m) push(bw[j++], "add");

  const spaced: DiffPart[] = [];
  for (const p of parts) {
    const prev = spaced[spaced.length - 1];
    if (
      prev &&
      ((prev.k === "del" && p.k === "add") || (prev.k === "add" && p.k === "del")) &&
      !/\s$/.test(prev.t) &&
      !/^\s/.test(p.t)
    ) {
      spaced.push({ t: " ", k: "same" });
    }
    const last = spaced[spaced.length - 1];
    if (last && last.k === p.k) last.t += p.t;
    else spaced.push({ ...p });
  }
  return spaced;
}

const TYPE_CONFIG = {
  grammar: {
    label: "Grammar",
    badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    dotClass: "bg-red-500",
  },
  spelling: {
    label: "Spelling",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dotClass: "bg-amber-500",
  },
  clarity: {
    label: "Clarity",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    dotClass: "bg-purple-500",
  },
  tone: {
    label: "Style & Tone",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dotClass: "bg-emerald-500",
  },
};

export const RichTextEditorSuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  anchorRect,
  onAccept,
  onDismiss,
  onAddToDictionary,
  onMouseEnter,
  onMouseLeave,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Enter to accept, Esc to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || ((e.metaKey || e.ctrlKey) && e.key === "Enter")) {
        e.preventDefault();
        onAccept(suggestion);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onDismiss(suggestion);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [suggestion, onAccept, onDismiss]);

  const word = isWordSuggestion(suggestion);
  const CARD_WIDTH = word ? 280 : 340;
  const ESTIMATED_HEIGHT = word ? 180 : 240;
  const GAP = 6;

  // Viewport-aware position calculations
  const left = Math.max(8, Math.min(anchorRect.left, window.innerWidth - CARD_WIDTH - 8));
  const below = anchorRect.bottom + GAP;
  const top =
    below + ESTIMATED_HEIGHT <= window.innerHeight - 8
      ? below
      : Math.max(8, anchorRect.top - ESTIMATED_HEIGHT - GAP);

  const parts = diffWords(suggestion.original, suggestion.replacement);
  const config = TYPE_CONFIG[suggestion.type] || TYPE_CONFIG.grammar;

  return createPortal(
    <div
      ref={cardRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ top: `${top}px`, left: `${left}px`, width: `${CARD_WIDTH}px` }}
      className="fixed z-[9999] rounded-xl border border-border bg-popover text-popover-foreground shadow-modal select-none overflow-hidden animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Header with Issue Type badge and Dismiss X */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40">
        <div className="flex items-center gap-1.5">
          <span className={cn("inline-block w-1.5 h-1.5 rounded-full", config.dotClass)} />
          <span className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">
            {config.label}
          </span>
        </div>
        <button
          onClick={() => onDismiss(suggestion)}
          className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Dismiss (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Explanation */}
      <div className="px-3.5 pt-2.5 pb-1 text-xs text-muted-foreground leading-relaxed">
        {suggestion.explanation}
      </div>

      {/* 1-Click Accept Diff Area */}
      <div className="px-2 py-1.5">
        <button
          onClick={() => onAccept(suggestion)}
          className="w-full text-left px-3 py-2 rounded-lg bg-foreground/3 hover:bg-foreground/8 dark:bg-white/4 dark:hover:bg-white/8 border border-border/70 hover:border-primary/40 transition-all group cursor-pointer"
          title="Click or press ↵ to apply"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm leading-snug">
              {parts.map((p, idx) =>
                p.k === "del" ? (
                  <span
                    key={idx}
                    className="text-red-500/80 dark:text-red-400/80 line-through decoration-red-500/60 mr-1"
                  >
                    {p.t}
                  </span>
                ) : p.k === "add" ? (
                  <span key={idx} className="font-semibold text-blue-600 dark:text-blue-400">
                    {p.t}
                  </span>
                ) : (
                  <span key={idx} className="text-foreground/80">
                    {p.t}
                  </span>
                )
              )}
            </div>
            <div className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-primary opacity-80 group-hover:opacity-100">
              <Check className="w-3.5 h-3.5" />
              <span>Apply</span>
            </div>
          </div>
        </button>
      </div>

      {/* Actions footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border/60 bg-muted/20 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1">
          {suggestion.type === "spelling" && onAddToDictionary && (
            <button
              onClick={() => onAddToDictionary(suggestion.original)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted hover:text-foreground transition-colors"
              title="Add word to personal dictionary"
            >
              <BookPlus className="w-3 h-3" />
              <span>Add to dict</span>
            </button>
          )}
          <button
            onClick={() => onDismiss(suggestion)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-muted hover:text-foreground transition-colors"
            title="Dismiss this issue"
          >
            <Trash2 className="w-3 h-3" />
            <span>Ignore</span>
          </button>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 font-medium">
          <Sparkles className="w-2.5 h-2.5 text-primary/70" />
          <span>Writely</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
