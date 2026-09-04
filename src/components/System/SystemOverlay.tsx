import React, { useEffect, useState } from 'react';
import { Check, X, Sparkles, Copy, Loader2, Send, ChevronDown, Languages } from 'lucide-react';
import { ASSISTANT_TABS, TRANSLATE_LANGUAGES, getSavedTranslateLang, saveTranslateLang, AssistantTab, AssistantResult } from '../../engine/selectionAssistant';

interface OverlayData {
  original: string;
  corrected: string;
  suggestions: { original: string; replacement: string; explanation: string; type: string }[];
  count: number;
  app?: string | null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// System-wide Grammarly-style popup. Rendered in a dedicated frameless
// always-on-top Electron window positioned at the cursor — i.e. over
// Gmail/Slack/Word/Chrome, NOT inside Writely's editor.
// Accept replaces the selected text wherever the user was writing.
export const SystemOverlay: React.FC = () => {
  const [tab, setTab] = useState<AssistantTab>('improve');
  const [result, setResult] = useState<AssistantResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatPrompts, setChatPrompts] = useState<string[]>([]);
  const [translateLang, setTranslateLang] = useState<string>(() => getSavedTranslateLang());
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [appName, setAppName] = useState<string | null>(null);

  useEffect(() => {
    const api = (window as any).writelySystem;
    if (!api?.onOverlayData) return;
    return api.onOverlayData((d: OverlayData) => {
      setTab('improve');
      setBusy(false);
      setChatOpen(false);
      setChatInput('');
      setChatPrompts([]);
      setAppName(d.app || null);
      const highlights = (d.suggestions || []).map((s) => s.replacement).filter(Boolean);
      setResult({
        tab: 'improve',
        title: d.count > 1 ? `${d.count} writing improvements` : d.suggestions[0]?.explanation.slice(0, 90) || 'Writing improvement',
        original: d.original,
        corrected: d.corrected,
        latencyMs: 0,
        count: d.count,
        highlights: highlights.slice(0, 12),
      });
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const applyRewriteRes = (t: AssistantTab, res: any) => {
    setResult({
      tab: t,
      title: res.title || t,
      original: res.original,
      corrected: res.corrected,
      latencyMs: res.latencyMs || 0,
      providerUsed: res.providerUsed,
      count: res.count ?? 1,
      highlights: Array.isArray(res.highlights) ? res.highlights : [],
      needsProvider: res.needsProvider,
    });
  };

  const handleTab = async (t: AssistantTab) => {
    if (t === tab || loading) return;
    setTab(t);
    setLoading(true);
    try {
      const res = await (window as any).writelySystem?.requestRewrite(
        t === 'translate' ? { tone: t, targetLang: translateLang } : t
      );
      if (res && !res.error) applyRewriteRes(t, res);
    } catch (_) {
      // keep previous result on failure
    } finally {
      setLoading(false);
    }
  };

  // Picking another target language instantly re-translates
  const handlePickLanguage = async (lang: string) => {
    if (lang === translateLang || loading) return;
    saveTranslateLang(lang);
    setTranslateLang(lang);
    if (tab !== 'translate') {
      setTab('translate');
    }
    setLoading(true);
    try {
      const res = await (window as any).writelySystem?.requestRewrite({ tone: 'translate', targetLang: lang });
      if (res && !res.error) applyRewriteRes('translate', res);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  // Chat submit: revise the CURRENT suggestion following the user's prompt
  const handleChatSubmit = async () => {
    const prompt = chatInput.trim();
    if (!prompt || loading || !result) return;
    setChatPrompts((prev) => [...prev, prompt]);
    setChatInput('');
    setLoading(true);
    try {
      const res = await (window as any).writelySystem?.requestRewrite({ instruction: prompt, base: result.corrected });
      if (res && !res.error) {
        setResult({
          tab: 'rephrase',
          title: 'Revised with AI',
          original: res.original,
          corrected: res.corrected,
          latencyMs: res.latencyMs || 0,
          providerUsed: res.providerUsed,
          count: res.count ?? 1,
          highlights: Array.isArray(res.highlights) ? res.highlights : [],
        });
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  // Accept → Main pastes the AI text over the selection in the other app
  const handleAccept = async () => {
    if (!result || busy) return;
    setBusy(true);
    try {
      await (window as any).writelySystem?.overlayAccept(result.corrected);
    } catch (_) {
      setBusy(false);
    }
  };

  const handleDismiss = async () => {
    if (busy) return;
    try {
      await (window as any).writelySystem?.overlayDismiss();
    } catch (_) {}
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.corrected);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {}
  };

  const renderBody = () => {
    if (loading || !result) {
      return (
        <div className="flex items-center gap-2 text-slate-500 py-4 justify-center text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Working…</span>
        </div>
      );
    }
    const { corrected, highlights } = result;
    if (result.needsProvider) {
      return (
        <span className="text-xs text-slate-600 leading-relaxed">
          No translator available. Run a local model (Ollama / LM Studio) — Writely will use it on-device — or paste an API key in Settings → AI Providers, then pick the language again.
        </span>
      );
    }
    if (!highlights || highlights.length === 0) return <span>{corrected}</span>;
    const pattern = new RegExp(`(${highlights.filter(Boolean).map(escapeRegExp).join('|')})`, 'g');
    const parts = corrected.split(pattern);
    const keys = highlights.filter(Boolean);
    return (
      <>
        {parts.map((p, i) =>
          i % 2 === 1 || keys.includes(p) ? (
            <span key={i} className="bg-emerald-200/70 text-emerald-900 rounded px-0.5 font-medium">
              {p}
            </span>
          ) : (
            <span key={i}>{p}</span>
          )
        )}
      </>
    );
  };

  if (!result && !loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-transparent">
        <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-2xl text-xs text-slate-500">
          Writely is listening… select text anywhere and press ⌘/Ctrl+Shift+G
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen p-2 bg-transparent">
      <div className="h-full flex flex-col rounded-2xl overflow-hidden bg-white border border-slate-300 shadow-2xl text-slate-900">
        {/* Dark header */}
        <div className="bg-slate-950 text-white px-4 py-2 text-xs font-semibold flex items-center gap-1.5 shrink-0">
          <span className="text-amber-400">★</span>
          <span>Writely suggestion · Free &amp; Offline</span>
          {appName ? <span className="ml-auto font-normal text-slate-400 truncate">in {appName}</span> : null}
        </div>

        {/* Tabs — sized to fit, no horizontal scrollbar */}
        <div className="flex items-center gap-3 px-3 pt-2 text-xs border-b border-slate-200 overflow-hidden whitespace-nowrap shrink-0">
          {ASSISTANT_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTab(t.id)}
              className={`pb-2 whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'font-bold text-slate-900 border-b-2 border-slate-900 -mb-px'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="border-l-4 border-emerald-500 pl-3">
            <div className="text-emerald-800 font-semibold text-sm">
              {loading ? 'Working…' : result?.title}
            </div>
            <div className="text-sm text-slate-800 mt-1 leading-relaxed break-words">{renderBody()}</div>
            <div className="flex items-center gap-2 mt-3">
              {!result?.needsProvider && (
                <button
                  onClick={handleAccept}
                  disabled={!result || loading || busy}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all active:scale-95"
                  title="Insert instantly"
                >
                  {busy ? 'Applying…' : 'Insert'}
                </button>
              )}
              {/* Target-language dropdown, side by side with Insert */}
              {tab === 'translate' && (
                <div className="relative">
                  <button
                    onClick={() => setLangMenuOpen((v) => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
                    title="Target language"
                  >
                    <Languages className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="max-w-[100px] truncate">{translateLang}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${langMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {langMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-[90]" onClick={() => setLangMenuOpen(false)} />
                      <div className="absolute bottom-full mb-1.5 left-0 z-[95] w-48 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl py-1">
                        {TRANSLATE_LANGUAGES.map((lang) => (
                          <button
                            key={lang}
                            onClick={() => {
                              setLangMenuOpen(false);
                              handlePickLanguage(lang);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 transition-colors ${
                              translateLang === lang ? 'font-bold text-blue-700' : 'text-slate-700'
                            }`}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              <button
                onClick={() => setChatOpen((v) => !v)}
                disabled={loading || busy || !result}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors disabled:opacity-40 ${
                  chatOpen ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Revise with AI</span>
              </button>
              <button
                onClick={handleCopy}
                className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Copy suggestion"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Inline AI chat: prompt → suggestion updates */}
            {chatOpen && (
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
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
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500"
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
  );
};
