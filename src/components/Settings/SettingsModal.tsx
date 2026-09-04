import React, { useState, useEffect } from 'react';
import { X, Settings, Sliders, ShieldCheck, Trash2, CheckCircle2, HelpCircle, ChevronDown, Pencil, ExternalLink, Sparkles } from 'lucide-react';
import { globalSentenceCache } from '../../engine/cache';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  debounceMs: number;
  setDebounceMs: (ms: number) => void;
  onOpenStyleGuide?: () => void;
}

type Tab = 'customization' | 'account' | 'blocklist';

// Persisted settings keys
const LS_KEYS = {
  superhumanGo: 'writely_settings_superhumanGo',
  language: 'writely_settings_language',
  detectTone: 'writely_settings_detectTone',
  shortcuts: 'writely_settings_shortcut',
  launchAtStartup: 'writely_settings_launchAtStartup',
  suggestionBundles: 'writely_settings_bundles',
  generativeSelection: 'writely_settings_genSelection',
  generativeEmail: 'writely_settings_genEmail',
  grammar: 'writely_settings_grammar',
  spelling: 'writely_settings_spelling',
  clarity: 'writely_settings_clarity',
};

function usePersisted<T>(key: string, fallback: T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw) as T;
    } catch {}
    return fallback;
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }, [key, val]);
  return [val, setVal];
}

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 shrink-0 ${checked ? 'bg-[#0e7a6b] dark:bg-[#0e7a6b]' : 'bg-slate-300 dark:bg-slate-700'}`}
    aria-pressed={checked}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0.5'} flex items-center justify-center`}>
      {checked && <CheckCircle2 className="w-3 h-3 text-[#0e7a6b]" />}
    </span>
  </button>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, debounceMs, setDebounceMs, onOpenStyleGuide }) => {
  const [tab, setTab] = useState<Tab>('customization');

  // Customization state — mirrors Grammarly screenshots
  const [superhumanGo, setSuperhumanGo] = usePersisted(LS_KEYS.superhumanGo, false);
  const [language, setLanguage] = usePersisted(LS_KEYS.language, 'Indian English');
  const [detectTone, setDetectTone] = usePersisted(LS_KEYS.detectTone, true);
  const [shortcut, setShortcut] = usePersisted(LS_KEYS.shortcuts, '^G');
  const [editingShortcut, setEditingShortcut] = useState(false);
  const [shortcutInput, setShortcutInput] = useState(shortcut);
  const [launchAtStartup, setLaunchAtStartup] = usePersisted(LS_KEYS.launchAtStartup, true);
  const [suggestionBundles, setSuggestionBundles] = usePersisted(LS_KEYS.suggestionBundles, true);
  const [genSelection, setGenSelection] = usePersisted(LS_KEYS.generativeSelection, true);
  const [genEmail, setGenEmail] = usePersisted(LS_KEYS.generativeEmail, true);

  // Engine prefs (advanced)
  const [grammarEnabled, setGrammarEnabled] = usePersisted(LS_KEYS.grammar, true);
  const [spellingEnabled, setSpellingEnabled] = usePersisted(LS_KEYS.spelling, true);
  const [clarityEnabled, setClarityEnabled] = usePersisted(LS_KEYS.clarity, true);

  const [cacheCleared, setCacheCleared] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [blocklist, setBlocklist] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('writely_blocklist') || '[]'); } catch { return []; }
  });
  const [blockInput, setBlockInput] = useState('');

  if (!isOpen) return null;

  const handleClearCache = () => {
    globalSentenceCache.clear();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  };

  const handleSaveShortcut = () => {
    setShortcut(shortcutInput.trim() || '^G');
    setEditingShortcut(false);
  };

  // Footer date — first install
  const sinceDate = (() => {
    try {
      const k = 'writely_first_install';
      let v = localStorage.getItem(k);
      if (!v) {
        v = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        localStorage.setItem(k, v);
      }
      return v;
    } catch { return 'September 16, 2022'; }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150" onClick={onClose}>
      <div
        className="relative w-full max-w-[520px] bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-3 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight">Settings</h2>
            <button onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex items-center gap-6 border-b border-slate-200 dark:border-white/10">
            {[
              { id: 'customization' as Tab, label: 'Customization' },
              { id: 'account' as Tab, label: 'Account' },
              { id: 'blocklist' as Tab, label: 'Block List' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`pb-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === t.id ? 'border-[#0e7a6b] text-[#0e7a6b] dark:text-[#2eb89a]' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-0">
          {tab === 'customization' && (
            <div className="space-y-4">
              {/* Use Superhuman Go */}
              <div className="flex items-start justify-between py-3.5 border-b border-slate-100 dark:border-white/5">
                <div className="pr-4">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Use Superhuman Go</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">Switch to Go, an upgraded product powered by AI agents, including Writely.</div>
                </div>
                <Toggle checked={superhumanGo} onChange={setSuperhumanGo} />
              </div>

              {/* I write in */}
              <div className="flex items-center justify-between py-3.5 border-b border-slate-100 dark:border-white/5">
                <div className="text-sm font-medium text-slate-900 dark:text-white">I write in</div>
                <div className="relative">
                  <button
                    onClick={() => setShowLangDropdown(v => !v)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white min-w-[180px] justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>🇮🇳</span> {language}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showLangDropdown && (
                    <div className="absolute right-0 mt-1.5 w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 shadow-xl z-10 overflow-hidden">
                      {['Indian English', 'American English', 'British English', 'Australian English', 'Canadian English'].map(opt => (
                        <button
                          key={opt}
                          onClick={() => { setLanguage(opt); setShowLangDropdown(false); }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/5 ${language === opt ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-medium' : 'text-slate-700 dark:text-slate-300'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Detect tone */}
              <div className="flex items-center justify-between py-3.5 border-b border-slate-100 dark:border-white/5">
                <div className="text-sm font-medium text-slate-900 dark:text-white">Detect tone in my writing</div>
                <Toggle checked={detectTone} onChange={setDetectTone} />
              </div>

              {/* Writing Style */}
              <div className="flex items-center justify-between py-3.5 border-b border-slate-100 dark:border-white/5">
                <div className="text-sm font-medium text-slate-900 dark:text-white">Writing Style</div>
                <button
                  onClick={() => { onClose(); onOpenStyleGuide?.(); }}
                  className="text-sm font-semibold text-[#0e7a6b] dark:text-[#2eb89a] hover:underline"
                >
                  Manage
                </button>
              </div>

              {/* Shortcuts */}
              <div className="py-3.5 border-b border-slate-100 dark:border-white/5">
                <div className="text-sm font-bold text-slate-900 dark:text-white mb-3">Shortcuts</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-700 dark:text-slate-300">Open Writely</span>
                  <div className="flex items-center gap-2">
                    {editingShortcut ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          value={shortcutInput}
                          onChange={e => setShortcutInput(e.target.value)}
                          placeholder="^G"
                          className="w-20 px-2 py-1 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 text-sm font-mono text-center"
                          autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveShortcut(); if (e.key === 'Escape') setEditingShortcut(false); }}
                        />
                        <button onClick={handleSaveShortcut} className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600"><CheckCircle2 className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded border border-slate-200 dark:border-white/10">{shortcut}</span>
                        <button onClick={() => setEditingShortcut(true)} className="text-sm font-semibold text-[#0e7a6b] dark:text-[#2eb89a] hover:underline">Edit</button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Launch at startup */}
              <div className="flex items-start justify-between py-3.5 border-b border-slate-100 dark:border-white/5">
                <div className="pr-4">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">Launch at startup</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Writely starts working as soon as you start your computer.</div>
                </div>
                <Toggle checked={launchAtStartup} onChange={setLaunchAtStartup} />
              </div>

              {/* Suggestion bundles */}
              <div className="flex items-start justify-between py-3.5 border-b border-slate-100 dark:border-white/5">
                <div className="pr-4">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Suggestion bundles</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Use bundles for spelling, punctuation, and grammar suggestions in the same sentence</div>
                </div>
                <Toggle checked={suggestionBundles} onChange={setSuggestionBundles} />
              </div>

              {/* Generative AI */}
              <div className="py-3.5 border-b border-slate-100 dark:border-white/5">
                <div className="text-sm font-bold text-slate-900 dark:text-white mb-3">Generative AI</div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 dark:text-slate-300">Show on text selection</span>
                    <Toggle checked={genSelection} onChange={setGenSelection} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 dark:text-slate-300">Show for email replies</span>
                    <Toggle checked={genEmail} onChange={setGenEmail} />
                  </div>
                </div>
              </div>

              {/* Advanced — Engine Preferences (collapsible) */}
              <details className="group py-3.5">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><Sliders className="w-4 h-4 text-indigo-600" />Advanced • Engine</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="mt-3 space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Typing Debounce</span>
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{debounceMs} ms</span>
                  </div>
                  <input type="range" min={40} max={300} step={10} value={debounceMs} onChange={e => setDebounceMs(Number(e.target.value))} className="w-full accent-[#0e7a6b] cursor-pointer" />
                  <div className="flex justify-between text-[10px] text-slate-500"><span>40ms</span><span>80ms Recommended</span><span>300ms</span></div>

                  <div className="space-y-2 pt-2">
                    {[
                      { label: 'Realtime Grammar', desc: 'Subject-verb, confused words', val: grammarEnabled, set: setGrammarEnabled },
                      { label: 'Fast Spell Check', desc: 'SymSpell <2ms', val: spellingEnabled, set: setSpellingEnabled },
                      { label: 'Clarity & Conciseness', desc: 'Wordiness, tautologies', val: clarityEnabled, set: setClarityEnabled },
                    ].map(row => (
                      <label key={row.label} className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 cursor-pointer">
                        <div><div className="text-xs font-semibold">{row.label}</div><div className="text-[11px] text-slate-500">{row.desc}</div></div>
                        <Toggle checked={row.val} onChange={row.set as any} />
                      </label>
                    ))}
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
                    <div><div className="text-xs font-semibold">Sentence Hash Cache</div><div className="text-[11px] text-slate-500">Hits: {globalSentenceCache.getStats().hits} • {globalSentenceCache.getStats().hitRate}</div></div>
                    <button onClick={handleClearCache} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-medium border border-slate-200 dark:border-white/10">
                      {cacheCleared ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Trash2 className="w-3.5 h-3.5" />}
                      {cacheCleared ? 'Cleared' : 'Clear'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
                    <div className="flex items-center gap-2"><HelpCircle className="w-4 h-4 text-indigo-600" /><div><div className="text-xs font-semibold">Tour</div><div className="text-[11px] text-slate-600 dark:text-slate-400">Mac vs Windows vs Web</div></div></div>
                    <button onClick={() => { try { localStorage.removeItem('writely_onboarded_v2'); } catch {}; window.location.reload(); }} className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border text-xs font-medium">Replay</button>
                  </div>
                </div>
              </details>
            </div>
          )}

          {tab === 'account' && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-semibold text-sm"><ShieldCheck className="w-4 h-4" />100% Offline • No account needed</div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed">Writely is Apache 2.0, no telemetry, no cloud. Your text never leaves this device. There is no Grammarly-style account.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Local profile</div>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Plan</span><span className="font-medium">Free Forever (Apache 2.0)</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Engine</span><span className="font-mono text-xs">Local • {navigator.platform || 'Unknown'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Models</span><span className="text-xs">{(() => { try { return JSON.parse(localStorage.getItem('writely_local_models_v2')||'[]').filter((m:any)=>m.status==='ready').length + ' ready'; } catch { return '—'; }})()}</span></div>
                </div>
              </div>
              <a href="https://github.com/BalaBenna/Writely" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5">
                View on GitHub <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {tab === 'blocklist' && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Block List</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sites and words where Writely won’t show suggestions. For the desktop app, this controls the system-wide overlay.</p>
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      placeholder="Add site (e.g. docs.google.com) or word"
                      value={blockInput}
                      onChange={e => setBlockInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && blockInput.trim()) { const next = [...new Set([...blocklist, blockInput.trim()])]; setBlocklist(next); localStorage.setItem('writely_blocklist', JSON.stringify(next)); setBlockInput(''); } }}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-900 text-sm"
                    />
                    <button
                      onClick={() => {
                        if (!blockInput.trim()) return;
                        const next = [...new Set([...blocklist, blockInput.trim()])];
                        setBlocklist(next);
                        localStorage.setItem('writely_blocklist', JSON.stringify(next));
                        setBlockInput('');
                      }}
                      className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {blocklist.length === 0 ? (
                      <div className="text-xs text-slate-500 py-2 text-center">No blocked items yet. Add a site or word above.</div>
                    ) : (
                      blocklist.map((item: string) => (
                        <div key={item} className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm shadow-sm">
                          <span className="truncate font-mono text-xs">{item}</span>
                          <button
                            onClick={() => {
                              const next = blocklist.filter(x => x !== item);
                              setBlocklist(next);
                              localStorage.setItem('writely_blocklist', JSON.stringify(next));
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-600 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">Tip: Block <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-white/10 font-mono text-xs">mail.google.com</code> to disable Writely in Gmail, or block technical jargon.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#252525] border-t border-slate-200 dark:border-white/10 shrink-0">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
            Writely has been correcting your text since {sinceDate}.<br />
            100% offline • <span className="font-medium">Apache 2.0</span> • No telemetry
          </p>
          <button
            onClick={() => window.open('https://github.com/BalaBenna/Writely', '_blank')}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#f5c86e] hover:bg-[#f0bb45] dark:bg-[#f5c86e] dark:hover:bg-[#f0bb45] text-slate-900 font-semibold text-sm shadow-sm transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Star on GitHub
          </button>
          <div className="mt-2 flex items-center justify-center gap-1 text-[11px] text-slate-500">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Zero Telemetry Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
};
