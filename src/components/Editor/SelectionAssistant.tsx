import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Copy, Check, Loader2, Sparkles, Send, Languages } from 'lucide-react';
import { runAssistantTab, reviseWithInstruction, ASSISTANT_TABS, TRANSLATE_LANGUAGES, getSavedTranslateLang, saveTranslateLang, AssistantTab, AssistantResult } from '../../engine/selectionAssistant';

export interface TextSelection {
  start: number;
  end: number;
}

interface SelectionAssistantProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  fullText: string;
  selection: TextSelection;
  onApply: (corrected: string, sel: TextSelection) => void;
  onClose: () => void;
}

// Viewport coords of a character offset inside a textarea (mirror-div technique)
function mirrorCoords(textarea: HTMLTextAreaElement, pos: number): { x: number; y: number; h: number } {
  const style = window.getComputedStyle(textarea);
  const div = document.createElement('div');
  const copyProps = [
    'fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'textTransform',
  ] as const;
  copyProps.forEach((p) => { (div.style as any)[p] = style[p]; });
  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.whiteSpace = 'pre-wrap';
  div.style.wordWrap = 'break-word';
  div.style.overflowWrap = 'break-word';
  div.style.width = `${textarea.clientWidth}px`;
  div.style.boxSizing = 'border-box';
  div.textContent = textarea.value.substring(0, pos);
  const marker = document.createElement('span');
  marker.textContent = '​';
  div.appendChild(marker);
  document.body.appendChild(div);
  const top = marker.offsetTop;
  const left = marker.offsetLeft;
  const h = marker.offsetHeight || parseFloat(style.lineHeight) || 20;
  document.body.removeChild(div);
  const rect = textarea.getBoundingClientRect();
  // Subtract scroll offsets — without this the popup drifts "somewhere"
  // on screen as soon as the editor is scrolled.
  return { x: rect.left + left - textarea.scrollLeft, y: rect.top + top - textarea.scrollTop, h };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const SelectionAssistant: React.FC<SelectionAssistantProps> = ({
  textareaRef,
  fullText,
  selection,
  onApply,
  onClose,
}) => {
  const [tab, setTab] = useState<AssistantTab>('improve');
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatPrompts, setChatPrompts] = useState<string[]>([]);
  const [translateLang, setTranslateLang] = useState<string>(() => getSavedTranslateLang());
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [langMenuPos, setLangMenuPos] = useState<{ top: number; left: number; openUp: boolean } | null>(null);
  const langBtnRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState<{ pill: { top: number; left: number }; panel: { top: number; left: number } } | null>(null);
  const runId = useRef(0);

  const selText = fullText.slice(selection.start, selection.end);

  // Fresh selection → reset to Improve tab, pill visible, popup closed
  useEffect(() => {
    setTab('improve');
    setResult(null);
    setOpen(false);
    setChatOpen(false);
    setChatInput('');
    setChatPrompts([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection.start, selection.end]);

  // Run the active tab (runs in background so the pill appears instantly).
  // Picking another target language re-runs Translate instantly.
  useEffect(() => {
    let cancelled = false;
    const id = ++runId.current;
    setLoading(true);
    runAssistantTab(selText, tab, translateLang)
      .then((r) => {
        if (cancelled || runId.current !== id) return;
        setResult(r);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled && runId.current === id) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selText, tab, translateLang]);

  // Anchor pill + popup to the selection; recompute on scroll/resize.
  // Popup sits JUST BELOW the selected text (anchored to its start),
  // falling back above only when there is no room below.
  useEffect(() => {
    const compute = () => {
      const ta = textareaRef.current;
      if (!ta) return;
      const a = mirrorCoords(ta, selection.start);
      const b = mirrorCoords(ta, selection.end);
      const taRect = ta.getBoundingClientRect();
      const pill = { top: a.y - 2, left: Math.max(8, taRect.left + 2) };
      const W = 530;
      const left = Math.max(8, Math.min(a.x, window.innerWidth - W - 8));
      const estH = 360;
      const below = b.y + b.h + 8;
      const top = below + estH <= window.innerHeight - 8 ? below : Math.max(8, a.y - estH - 8);
      setPos({ pill, panel: { top, left } });
    };
    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    const ta = textareaRef.current;
    ta?.addEventListener('scroll', compute, { passive: true });
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
      ta?.removeEventListener('scroll', compute);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection.start, selection.end]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!pos) return null;

  // Chat submit: revise the CURRENT suggestion following the user's prompt
  const handleChatSubmit = async () => {
    const prompt = chatInput.trim();
    if (!prompt || loading || !result) return;
    const id = ++runId.current;
    setChatPrompts((prev) => [...prev, prompt]);
    setChatInput('');
    setLoading(true);
    try {
      const r = await reviseWithInstruction(result.corrected, prompt);
      if (runId.current !== id) return;
      setResult(r);
    } finally {
      if (runId.current === id) setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.corrected);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {}
  };

  const handlePickLanguage = (lang: string) => {
    setLangMenuOpen(false);
    setLangMenuPos(null);
    if (lang === translateLang) return;
    saveTranslateLang(lang);
    setTranslateLang(lang);
  };

  // Open the language menu as a body-level portal anchored to the button,
  // so it never gets clipped inside the popup container.
  const toggleLangMenu = () => {
    if (langMenuOpen) {
      setLangMenuOpen(false);
      setLangMenuPos(null);
      return;
    }
    const btn = langBtnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const MENU_W = 208;
    const MENU_H = 208;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - MENU_W - 8));
    const below = rect.bottom + 4;
    const openUp = below + MENU_H > window.innerHeight - 8;
    setLangMenuPos({ top: openUp ? Math.max(8, rect.top - MENU_H - 4) : below, left, openUp });
    setLangMenuOpen(true);
  };

  // A scroll/resize would detach the menu from its button — just close it.
  useEffect(() => {
    if (!langMenuOpen) return;
    const close = () => {
      setLangMenuOpen(false);
      setLangMenuPos(null);
    };
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [langMenuOpen]);

  const renderBody = () => {
    if (loading || !result) {
      return (
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 py-4 justify-center text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{tab === 'translate' ? `Translating to ${translateLang}…` : 'Checking selection…'}</span>
        </div>
      );
    }
    if (result.needsProvider) {
      return (
        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          No translator available. Either run a local model (<strong>Ollama</strong> e.g. <code className="font-mono bg-slate-100 dark:bg-white/10 px-1 rounded">ollama pull qwen2.5</code> / <strong>LM Studio</strong>) — Writely will use it on-device — or paste an API key in <strong>Settings → AI Providers</strong> (OpenRouter recommended), then pick the language again.
        </div>
      );
    }
    const { corrected, highlights } = result;
    if (!highlights || highlights.length === 0) {
      return <span>{corrected}</span>;
    }
    const pattern = new RegExp(`(${highlights.filter(Boolean).map(escapeRegExp).join('|')})`, 'g');
    const parts = corrected.split(pattern);
    const keys = highlights.filter(Boolean);
    return (
      <>
        {parts.map((p, i) =>
          i % 2 === 1 || keys.includes(p) ? (
            <span key={i} className="bg-emerald-200/70 dark:bg-emerald-500/25 text-emerald-900 dark:text-emerald-200 rounded px-0.5 font-medium">
              {p}
            </span>
          ) : (
            <span key={i}>{p}</span>
          )
        )}
      </>
    );
  };

  return createPortal(
    <>
      {/* Blue selection pill (Grammarly-style) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          onMouseEnter={() => setOpen(true)}
          className="fixed z-[80] w-[22px] h-[44px] rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center transition-colors"
          style={{ top: `${pos.pill.top}px`, left: `${pos.pill.left}px` }}
          title="Writely suggestions"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Rich suggestion popup */}
      {open && (
        <div
          className="fixed z-[80] w-[520px] max-w-[calc(100vw-16px)]"
          style={{ top: `${pos.panel.top}px`, left: `${pos.panel.left}px` }}
        >
          <div className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 shadow-2xl">
            {/* Dark header */}
            <div className="bg-slate-950 dark:bg-black text-white px-4 py-2 text-xs font-semibold flex items-center gap-1.5">
              <span className="text-amber-400">★</span>
              <span>Writely suggestion · Free &amp; Offline</span>
            </div>

            {/* Tabs — sized to fit, no horizontal scrollbar */}
            <div className="flex items-center gap-3 px-3 pt-2 pb-0 text-xs border-b border-slate-200 dark:border-white/10 overflow-hidden whitespace-nowrap">
              {ASSISTANT_TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`pb-2 whitespace-nowrap transition-colors ${
                    tab === t.id
                      ? 'font-bold text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white -mb-px'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="p-4">
              <div className="border-l-4 border-emerald-500 pl-3">
                <div className="text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
                  {loading ? 'Working…' : result?.title || 'Checking…'}
                </div>
                <div className="text-sm text-slate-800 dark:text-slate-200 mt-1 leading-relaxed break-words">
                  {renderBody()}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {!result?.needsProvider && (
                    <button
                      onClick={() => result && onApply(result.corrected, selection)}
                      disabled={!result || loading}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all active:scale-95"
                      title="Insert instantly"
                    >
                      Insert
                    </button>
                  )}
                  {/* Target-language dropdown, side by side with Insert.
                      The menu itself is portalled to document.body so it
                      opens outside (below) the popup container. */}
                  {tab === 'translate' && (
                    <button
                      ref={langBtnRef}
                      onClick={toggleLangMenu}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-white/15 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                      title="Target language"
                    >
                      <Languages className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span className="max-w-[110px] truncate">{translateLang}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                  {langMenuOpen &&
                    langMenuPos &&
                    createPortal(
                      <>
                        <div
                          className="fixed inset-0 z-[90]"
                          onClick={() => {
                            setLangMenuOpen(false);
                            setLangMenuPos(null);
                          }}
                        />
                        <div
                          className="fixed z-[95] w-52 max-h-52 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 shadow-2xl py-1"
                          style={{ top: `${langMenuPos.top}px`, left: `${langMenuPos.left}px` }}
                        >
                          {TRANSLATE_LANGUAGES.map((lang) => (
                            <button
                              key={lang}
                              onClick={() => handlePickLanguage(lang)}
                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-white/10 transition-colors ${
                                translateLang === lang
                                  ? 'font-bold text-blue-700 dark:text-blue-300'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                      </>,
                      document.body
                    )}
                  <button
                    onClick={() => setChatOpen((v) => !v)}
                    disabled={loading || !result}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-40 ${
                      chatOpen
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-300 dark:border-white/15 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Revise with AI</span>
                  </button>
                  <button
                    onClick={handleCopy}
                    className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    title="Copy suggestion"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Inline AI chat: prompt → suggestion updates */}
                {chatOpen && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 space-y-2">
                    {chatPrompts.length > 0 && (
                      <div className="space-y-1.5 max-h-24 overflow-y-auto">
                        {chatPrompts.map((p, i) => (
                          <div key={i} className="flex justify-end">
                            <div className="max-w-[85%] px-2.5 py-1.5 rounded-xl rounded-br-sm bg-indigo-600 text-white text-xs leading-relaxed break-words">
                              {p}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleChatSubmit();
                          }
                        }}
                        placeholder="e.g. Make it shorter and friendlier…"
                        autoFocus
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={handleChatSubmit}
                        disabled={!chatInput.trim() || loading}
                        className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors"
                        title="Send"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};
