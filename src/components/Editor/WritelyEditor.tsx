import React, { useRef, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Copy, Check, Trash2 } from 'lucide-react';
import { Suggestion } from '../../types';
import { SuggestionCard, isWordSuggestion } from './SuggestionCard';
import { SelectionAssistant } from './SelectionAssistant';

// Estimate popup height for anchoring. Word card is compact,
// sentence card is taller.
function estimatedCardHeight(s: Suggestion): number {
  return isWordSuggestion(s) ? 190 : 300;
}

// Viewport-fixed position (for a document.body portal): the popup sits
// JUST BELOW the hovered word/sentence. Only when there is no room below
// does it fall back above. Clamped inside the viewport.
function positionForRect(rect: DOMRect, s: Suggestion): { top: number; left: number } {
  const CARD_W = isWordSuggestion(s) ? 260 : 400;
  const GAP = 6;
  const estH = estimatedCardHeight(s);
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - CARD_W - 8));
  const below = rect.bottom + GAP;
  const top =
    below + estH <= window.innerHeight - 8 ? below : Math.max(8, rect.top - estH - GAP);
  return { top, left };
}

interface WritelyEditorProps {
  text: string;
  onChange: (newText: string) => void;
  suggestions: Suggestion[];
  onAcceptSuggestion: (suggestion: Suggestion) => void;
  onDismissSuggestion: (suggestion: Suggestion) => void;
  onAddToDictionary: (word: string) => void;
  onFixAll: () => void;
  activeSuggestionId: string | null;
  setActiveSuggestionId: (id: string | null) => void;
}

const SAMPLE_TEXTS = [
  {
    title: 'Grammar & Agreement',
    content:
      'He go to the store yesterday and bought three apple . Their are many reasons why this is a bad idea , due to the fact that he don\'t have no money . We is hoping that you can fix this asap .',
  },
  {
    title: 'Wordiness & Clarity',
    content:
      'In order to facilitate the meeting , we must at this point in time gather each and every participant . The manager has the ability to approve the proposal for a period of time .',
  },
  {
    title: 'Common Confusions',
    content:
      'Their going to lose they\'re car over their . Its a very unique situation , and your welcome to review the side affects before making a decision better then before .',
  },
];

export const WritelyEditor: React.FC<WritelyEditorProps> = ({
  text,
  onChange,
  suggestions,
  onAcceptSuggestion,
  onDismissSuggestion,
  onAddToDictionary,
  onFixAll,
  activeSuggestionId,
  setActiveSuggestionId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [copied, setCopied] = useState(false);
  const [cardPosition, setCardPosition] = useState({ top: 100, left: 100 });
  // Explicit text selection → Grammarly-style blue pill + rich popup
  const [textSelection, setTextSelection] = useState<{ start: number; end: number } | null>(null);

  // Sync scrolling between textarea and highlighted backdrop
  const handleScroll = useCallback(() => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeSuggestion = suggestions.find((s) => s.id === activeSuggestionId) || null;
  const activeIndex = suggestions.findIndex((s) => s.id === activeSuggestionId);

  // Show suggestion card on hover (Grammarly style).
  // Position is viewport-fixed and the card is portalled to document.body,
  // so it renders OUTSIDE the overflow-hidden editor container (never clipped).
  const handleIssueMouseEnter = (s: Suggestion, e: React.MouseEvent) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setCardPosition(positionForRect(rect, s));
    setActiveSuggestionId(s.id);
  };

  // Keep the portalled card anchored to its <mark> on scroll/resize.
  useEffect(() => {
    if (!activeSuggestionId) return;
    const anchor = suggestions.find((s) => s.id === activeSuggestionId) || null;
    if (!anchor) return;

    const reposition = () => {
      const el = document.querySelector(`[data-suggestion-id="${anchor.id}"]`);
      if (!el) return;
      setCardPosition(positionForRect(el.getBoundingClientRect(), anchor));
    };

    const ta = textareaRef.current;
    const bd = backdropRef.current;
    ta?.addEventListener('scroll', reposition, { passive: true });
    bd?.addEventListener('scroll', reposition, { passive: true });
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      ta?.removeEventListener('scroll', reposition);
      bd?.removeEventListener('scroll', reposition);
      window.removeEventListener('scroll', reposition);
      window.removeEventListener('resize', reposition);
    };
  }, [activeSuggestionId, suggestions]);

  const handleIssueMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setActiveSuggestionId(null);
    }, 300);
  };

  const handleCardMouseEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  };

  const handleCardMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setActiveSuggestionId(null);
    }, 250);
  };

  // Track explicit selection in the textarea to anchor the blue pill.
  // Collapsed caret or selection while the suggestion card is hovered → hide.
  const updateTextSelection = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart ?? 0;
    const e = ta.selectionEnd ?? 0;
    if (e > s && e - s >= 2 && document.activeElement === ta) {
      setActiveSuggestionId(null);
      setTextSelection({ start: s, end: e });
    } else {
      setTextSelection(null);
    }
  }, [setActiveSuggestionId]);

  // Apply the assistant's corrected text over the selected range
  const handleApplySelection = useCallback(
    (corrected: string, sel: { start: number; end: number }) => {
      const updated = text.slice(0, sel.start) + corrected + text.slice(sel.end);
      onChange(updated);
      setTextSelection(null);
      setActiveSuggestionId(null);
      requestAnimationFrame(() => {
        const ta = textareaRef.current;
        if (ta) {
          const pos = sel.start + corrected.length;
          ta.focus();
          try {
            ta.setSelectionRange(pos, pos);
          } catch (_) {}
        }
      });
    },
    [text, onChange, setActiveSuggestionId]
  );

  // Build the highlight overlay.
  // The entire overlay has color:transparent so no text is visible.
  // Only the CSS text-decoration (horizontal underlines with explicit colors)
  // and background-color on <mark> elements show through.
  const renderHighlightedText = () => {
    if (!text) return null;
    if (suggestions.length === 0) return <span>{text}</span>;

    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    // Sort suggestions by start position to handle properly
    const sorted = [...suggestions].sort((a, b) => a.start - b.start);

    sorted.forEach((s) => {
      if (s.start > lastIndex) {
        segments.push(
          <span key={`gap-${lastIndex}`}>{text.substring(lastIndex, s.start)}</span>
        );
      }

      const issueChunk = text.substring(s.start, s.end);
      const isActive = s.id === activeSuggestionId;
      const classMap: Record<string, string> = {
        grammar: 'issue-grammar',
        spelling: 'issue-spelling',
        clarity: 'issue-clarity',
        tone: 'issue-tone',
      };

      segments.push(
        <mark
          key={`issue-${s.id}`}
          data-suggestion-id={s.id}
          onMouseEnter={(e) => handleIssueMouseEnter(s, e)}
          onMouseLeave={handleIssueMouseLeave}
          className={`${classMap[s.type]} ${isActive ? 'active ring-2 ring-indigo-500/80' : ''} pointer-events-auto cursor-pointer`}
        >
          {issueChunk}
        </mark>
      );

      lastIndex = s.end;
    });

    if (lastIndex < text.length) {
      segments.push(
        <span key={`gap-${lastIndex}`}>{text.substring(lastIndex)}</span>
      );
    }

    return segments;
  };

  return (
    <div className="relative flex-1 flex flex-col h-full bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-xl transition-colors duration-200">
      {/* Editor Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-white/5">
        <div className="flex items-center space-x-2 overflow-x-auto py-0.5 scrollbar-none text-xs">
          <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium hidden sm:inline">
            Try Demo:
          </span>
          {SAMPLE_TEXTS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                onChange(sample.content);
                setActiveSuggestionId(null);
              }}
              className="px-2.5 py-1 rounded-md bg-slate-200/70 hover:bg-slate-300/70 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-[11px] border border-slate-300/60 dark:border-white/5 whitespace-nowrap transition-colors"
            >
              {sample.title}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          {suggestions.length > 0 && (
            <button
              onClick={onFixAll}
              className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
              title="Apply all suggestions at once"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fix All ({suggestions.length})</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            disabled={!text}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
            title="Copy text"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => {
              onChange('');
              setActiveSuggestionId(null);
            }}
            disabled={!text}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
            title="Clear text"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Canvas */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full min-h-[360px] text-base font-sans overflow-hidden"
      >
        {/*
          LAYER 1 (BACK): Textarea — user types here.
          No z-index (default), receives keyboard input.
          bg-transparent so underlines behind it would show,
          but we actually put the overlay IN FRONT (z-20).
          The textarea still receives keyboard events because
          it stays focused; click-through from the overlay's
          pointer-events:none areas also reaches it.
        */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onSelect={updateTextSelection}
          onKeyUp={updateTextSelection}
          onMouseUp={updateTextSelection}
          onScroll={handleScroll}
          placeholder="Start typing or paste your text here to analyze with local AI..."
          spellCheck={false}
          className="absolute inset-0 p-6 w-full h-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 resize-none border-none outline-none font-sans text-base leading-relaxed whitespace-pre-wrap break-words overflow-y-auto"
        />

        {/*
          LAYER 2 (FRONT): Highlight overlay — sits IN FRONT of textarea.
          
          KEY: `color: transparent` on container makes ALL text invisible.
           The horizontal underlines survive because text-decoration uses explicit
          colors (#ef4444, etc.) NOT currentColor.
          The background highlights survive because they also use explicit rgba().
          
          pointer-events: none on container → clicks pass through to textarea.
          pointer-events: auto on <mark> → marks capture hover for suggestion cards.
        */}
        <div
          ref={backdropRef}
          aria-hidden="true"
          style={{ color: 'transparent', caretColor: 'transparent' }}
          className="absolute inset-0 p-6 z-20 pointer-events-none overflow-y-auto font-sans text-base leading-relaxed whitespace-pre-wrap break-words select-none"
        >
          {renderHighlightedText()}
        </div>

      </div>

      {/* LAYER 3 (HIGHEST): Floating Suggestion Card — portalled to
          document.body with position:fixed so it renders OUTSIDE the
          overflow-hidden editor container and is never clipped. */}
      {activeSuggestion &&
        createPortal(
          <div
            className="fixed z-[80] pointer-events-auto"
            style={{ top: `${cardPosition.top}px`, left: `${cardPosition.left}px` }}
          >
            <SuggestionCard
              suggestion={activeSuggestion}
              currentIndex={activeIndex}
              totalCount={suggestions.length}
              onAccept={onAcceptSuggestion}
              onDismiss={onDismissSuggestion}
              onAddToDictionary={onAddToDictionary}
              onMouseEnter={handleCardMouseEnter}
              onMouseLeave={handleCardMouseLeave}
            />
          </div>,
          document.body
        )}

      {/* Selection pill + rich popup (Grammarly-style, portalled outside container) */}
      {textSelection && (
        <SelectionAssistant
          textareaRef={textareaRef}
          fullText={text}
          selection={textSelection}
          onApply={handleApplySelection}
          onClose={() => setTextSelection(null)}
        />
      )}
    </div>
  );
};
