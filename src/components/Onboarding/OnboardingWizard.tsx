import React, { useState, useEffect } from 'react';
import {
  X, Feather, ShieldCheck, Cpu, Download, Zap, Apple, Monitor, Globe,
  ChevronRight, ChevronLeft, Check, Keyboard, BellOff, RefreshCw, Lock, Eye, ExternalLink,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  initialStep?: number;
  // Forced gate (first run): no X / Skip — user must finish setup
  forced?: boolean;
  onClose: () => void;
  onGoToModels?: () => void;
  onGoToEditor?: () => void;
}

type Platform = 'mac' | 'windows' | 'web';

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'web';
  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator as any).userAgentData?.platform?.toLowerCase() || navigator.platform.toLowerCase();
  if (platform.includes('mac') || ua.includes('mac')) return 'mac';
  if (platform.includes('win') || ua.includes('win')) return 'windows';
  return 'web';
}

const STORAGE_KEY = 'writely_onboarded_v2';

export const hasCompletedOnboarding = (): boolean => {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return true; }
};
export const markOnboardingComplete = () => {
  try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
};

type A11yState = 'checking' | 'granted' | 'needed' | 'unavailable';

const STEPS = ['Welcome', 'Permissions', 'Models', 'Try it'];

export const OnboardingWizard: React.FC<Props> = ({ isOpen, initialStep = 0, forced = false, onClose, onGoToModels, onGoToEditor }) => {
  const [step, setStep] = useState(initialStep);
  const [platform, setPlatform] = useState<Platform>('web');
  const [a11y, setA11y] = useState<A11yState>('checking');
  // Explicit opt-in for system-wide fixes — OFF by default, never assumed
  const [optIn, setOptIn] = useState(false);

  useEffect(() => { setPlatform(detectPlatform()); }, []);
  useEffect(() => { if (isOpen) setStep(Math.min(Math.max(0, initialStep), STEPS.length - 1)); }, [isOpen, initialStep]);

  const checkPermissions = async () => {
    setA11y('checking');
    try {
      const api = (window as any).writelyCapture;
      if (!api?.checkAccessibility) {
        setA11y('unavailable');
        return;
      }
      const res = await api.checkAccessibility();
      setA11y(res?.granted ? 'granted' : 'needed');
    } catch {
      setA11y('needed');
    }
  };

  useEffect(() => {
    if (isOpen && step === 1) {
      // Load current opt-in (default OFF on fresh installs) + check access
      (window as any).writelySystem
        ?.getSystemOptIn?.()
        .then((v: boolean) => setOptIn(!!v))
        .catch(() => setOptIn(false));
      checkPermissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, step]);

  const handleOptIn = async (enabled: boolean) => {
    setOptIn(enabled);
    try {
      await (window as any).writelySystem?.setSystemOptIn?.(enabled);
    } catch (_) {}
    if (enabled) checkPermissions();
  };

  if (!isOpen) return null;

  const totalSteps = STEPS.length;

  const handleNext = () => {
    if (step < totalSteps - 1) setStep((s) => s + 1);
    else {
      markOnboardingComplete();
      onClose();
    }
  };
  const handleSkip = () => {
    markOnboardingComplete();
    onClose();
  };
  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const PlatformIcon = platform === 'mac' ? Apple : platform === 'windows' ? Monitor : Globe;

  // Full-bleed setup page: header, flowing content, and a footer bar
  // docked to the page itself — no floating cards, no detached pill bars.
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-50 dark:bg-slate-950 animate-in fade-in duration-150">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-violet-500/10 dark:from-blue-500/20 dark:via-indigo-500/15 dark:to-violet-500/20" />

      {/* Header — full-width band */}
      <div className="relative shrink-0 border-b border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-950/60 backdrop-blur">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-600/25">
                <Feather className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">Welcome to Writely</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <PlatformIcon className="w-3 h-3" />
                  {platform === 'mac' ? 'macOS' : platform === 'windows' ? 'Windows 10 / 11' : 'Web demo'}
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span>Step {step + 1} of {totalSteps} — {STEPS[step]}</span>
                </div>
              </div>
            </div>
            {!forced && (
              <button
                onClick={handleSkip}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                title="Skip tour"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {/* Dots */}
          <div className="flex items-center gap-1.5 mt-4">
            {STEPS.map((label, i) => (
              <button
                key={label}
                onClick={() => i <= step && setStep(i)}
                title={label}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-8 bg-blue-600' : i < step ? 'w-4 bg-blue-300 dark:bg-blue-500/60' : 'w-4 bg-slate-200 dark:bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content — flows full-width, no card */}
      <div className="relative flex-1 overflow-y-auto">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
          {/* STEP 0 — Welcome */}
          {step === 0 && (
            <div className="space-y-5 pt-1">
              <div>
                <h2 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                  Write anywhere.
                  <br />
                  Fix everywhere.
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Select text in any app, press{' '}
                  <kbd className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 font-mono text-xs font-semibold">
                    ⌘⇧G
                  </kbd>{' '}
                  and Writely fixes it on the spot — <strong className="text-slate-900 dark:text-white">100% on-device</strong>, zero telemetry.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { icon: Keyboard, tint: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', title: '⌘⇧G anywhere', sub: 'system-wide' },
                  { icon: Zap, tint: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', title: '<50ms', sub: 'realtime' },
                  { icon: ShieldCheck, tint: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', title: 'Offline', sub: 'Apache 2.0' },
                ].map((c) => (
                  <div key={c.title} className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-center">
                    <div className={`w-8 h-8 mx-auto rounded-xl ${c.bg} flex items-center justify-center mb-1.5`}>
                      <c.icon className={`w-4 h-4 ${c.tint}`} />
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{c.title}</div>
                    <div className="text-[11px] text-slate-500">{c.sub}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto whitespace-nowrap">
                <span>select</span>
                <span className="text-slate-500">→</span>
                <span className="text-emerald-400">⌘⇧G</span>
                <span className="text-slate-500">→</span>
                <span className="text-amber-300">correct</span>
                <span className="text-slate-500">→</span>
                <span className="text-sky-300">popup</span>
                <span className="text-slate-500">→</span>
                <span className="text-violet-300">Insert</span>
              </div>
            </div>
          )}

          {/* STEP 1 — Permissions (clean + cool) */}
          {step === 1 && (
            <div className="pt-1">
              <div className="relative overflow-hidden rounded-3xl border border-indigo-200/60 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-sky-500/10 to-emerald-500/10 dark:from-indigo-500/20 dark:via-sky-500/10 dark:to-emerald-500/15 p-5">
                <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-indigo-400/30 to-sky-400/20 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-gradient-to-tr from-emerald-400/25 to-sky-400/15 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur border border-white/60 dark:border-white/15 shadow-sm flex items-center justify-center">
                      <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                    </div>
                    <div>
                      <h2 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight">One permission, fully private</h2>
                      <p className="text-xs text-slate-600 dark:text-slate-300">Writely reads only your selected text — it never leaves this device.</p>
                    </div>
                  </div>

                  {/* Explicit opt-in switch — system-wide stays OFF until tapped */}
                  {platform !== 'web' && (
                    <button
                      onClick={() => handleOptIn(!optIn)}
                      className="mt-4 w-full flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900 dark:bg-white text-left shadow-lg transition-all active:scale-[0.99]"
                      aria-pressed={optIn}
                    >
                      <span
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 shrink-0 ${
                          optIn ? 'bg-emerald-500' : 'bg-white/20 dark:bg-slate-900/20'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                            optIn ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-white dark:text-slate-900">
                          {optIn ? 'System-wide fixes: ON' : 'Enable system-wide fixes'}
                        </span>
                        <span className="block text-[11px] text-white/70 dark:text-slate-600 leading-snug">
                          {optIn
                            ? 'Writely may read text you select in other apps, only when you press ⌘⇧G.'
                            : 'Opt in to let ⌘⇧G fix selected text in any app. Off by default.'}
                        </span>
                      </span>
                    </button>
                  )}

                  {/* Live status */}
                  <div className="mt-3 flex items-center gap-2.5 p-3 rounded-2xl bg-white/70 dark:bg-slate-950/50 backdrop-blur border border-white/60 dark:border-white/10">
                    {a11y === 'checking' ? (
                      <>
                        <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
                        <span className="text-xs text-slate-600 dark:text-slate-300">Checking system access…</span>
                      </>
                    ) : a11y === 'granted' ? (
                      <>
                        <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </span>
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          {optIn ? 'All set — system-wide fixes are enabled.' : 'OS permission granted — opt in above to switch on.'}
                        </span>
                      </>
                    ) : a11y === 'unavailable' ? (
                      <>
                        <Eye className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-xs text-slate-600 dark:text-slate-300">Desktop app only — the web demo needs no permissions.</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="text-xs text-slate-700 dark:text-slate-200">Permission needed for fixes outside this app.</span>
                        <span className="ml-auto flex items-center gap-1.5 shrink-0">
                          {platform !== 'web' && (
                            <button
                              onClick={() => (window as any).writelySystem?.openSystemSettings?.(platform === 'mac' ? 'accessibility' : 'privacy')}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-colors"
                            >
                              Open Settings <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={checkPermissions}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-semibold hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors"
                          >
                            <RefreshCw className="w-3 h-3" /> Check again
                          </button>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Platform cards */}
                  {platform === 'mac' && (
                    <div className="mt-3 grid gap-2">
                      {[
                        { n: '1', title: 'Accessibility', desc: 'System Settings → Privacy & Security → Accessibility → enable Writely', tag: 'For ⌘⇧G capture', pane: 'accessibility' },
                        { n: '2', title: 'Input Monitoring', desc: 'Same page → Input Monitoring → enable Writely', tag: 'For global hotkey', pane: 'input' },
                      ].map((c) => (
                        <button
                          key={c.n}
                          onClick={() => (window as any).writelySystem?.openSystemSettings?.(c.pane)}
                          className="w-full text-left flex items-center gap-3 p-3 rounded-2xl bg-white/70 dark:bg-slate-950/50 backdrop-blur border border-white/60 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-900 transition-all active:scale-[0.99] group"
                          title="Click to open this settings pane"
                        >
                          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                            {c.n}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-bold text-slate-900 dark:text-white">
                              {c.title} <span className="ml-1 font-mono font-medium text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">{c.tag}</span>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{c.desc}</div>
                          </div>
                          <span className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity">
                            Open <ExternalLink className="w-3.5 h-3.5" />
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {platform === 'windows' && (
                    <button
                      onClick={() => (window as any).writelySystem?.openSystemSettings?.('privacy')}
                      className="mt-3 w-full text-left p-3 rounded-2xl bg-white/70 dark:bg-slate-950/50 backdrop-blur border border-white/60 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all active:scale-[0.99] group"
                      title="Click to open Windows privacy settings"
                    >
                      <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Windows needs <strong className="text-slate-900 dark:text-white">no special permission</strong> — install, select text, press{' '}
                        <kbd className="font-mono px-1 rounded bg-slate-900 text-white text-[10px]">Ctrl+Shift+G</kbd>. If SmartScreen warns on first run: <em>More info → Run anyway</em>.
                      </div>
                      <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        Open Privacy settings <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  )}
                  {platform === 'web' && (
                    <div className="mt-3 p-3 rounded-2xl bg-white/70 dark:bg-slate-950/50 backdrop-blur border border-white/60 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      You're on the <strong className="text-slate-900 dark:text-white">web demo</strong> — nothing to grant. Download the desktop app to unlock system-wide fixes.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Models */}
          {step === 2 && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                </div>
                <div>
                  <h2 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight">Models — download once, yours forever</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Stored in <code className="font-mono">~/.writely/models/</code> • delete anytime • no account</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { name: 'Grammar engine', meta: 'Built-in • <50ms realtime', state: 'Included', hot: true },
                  { name: 'Writing models (Qwen / Mistral / Llama)', meta: 'Your GGUFs, Ollama or LM Studio — auto-detected', state: 'Auto-detect', hot: false },
                  { name: 'Cloud providers (optional)', meta: 'OpenRouter, OpenAI, Claude… bring your own key', state: 'BYOK', hot: false },
                ].map((m) => (
                  <div key={m.name} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{m.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{m.meta}</div>
                    </div>
                    <span
                      className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                        m.hot
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {m.state}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onGoToModels?.()}
                className="w-full py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" /> Open Model Catalog
              </button>
            </div>
          )}

          {/* STEP 3 — Try it */}
          {step === 3 && (
            <div className="space-y-4 pt-1">
              <h2 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight">Try it — your turn</h2>
              <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed border border-slate-800">
                He go to store yesterday. Their are many reason due to the fact that he don't have no money.
              </div>
              <ul className="text-[13px] text-slate-600 dark:text-slate-400 space-y-1.5">
                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Hover an underline → a card appears just below it → click to fix (<kbd className="font-mono text-[11px]">⌘↵</kbd>).</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Select a sentence → blue pill → Improve, Translate, tones, AI chat.</li>
                <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Anywhere on your Mac/PC → select text → <kbd className="font-mono text-[11px]">⌘⇧G</kbd> → Insert.</li>
              </ul>
              <button
                onClick={() => onGoToEditor?.()}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all active:scale-[0.99]"
              >
                <Check className="w-4 h-4" /> Open Editor & Start Writing
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer — docked page bar attached to the screen flow, not a floating pill */}
      <div className="relative shrink-0 border-t border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-2">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Step {step + 1} of {totalSteps} — {STEPS[step]}
          </div>
          <div className="flex items-center gap-2">
            {!forced && (
              <button onClick={handleSkip} className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
            >
              {step === totalSteps - 1 ? 'Get Started' : step === 1 ? 'Activate & Continue' : 'Next'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
