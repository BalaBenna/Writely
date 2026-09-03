import React, { useState, useEffect } from 'react';
import { X, Sparkles, ShieldCheck, Cpu, Download, Settings2, BookOpen, Zap, Apple, Monitor, Globe, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
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
  // Tauri desktop also reports platform via UA; fallback to web
  return 'web';
}

const STORAGE_KEY = 'writely_onboarded_v2';

export const hasCompletedOnboarding = (): boolean => {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return true; }
};
export const markOnboardingComplete = () => {
  try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
};

export const OnboardingWizard: React.FC<Props> = ({ isOpen, onClose, onGoToModels, onGoToEditor }) => {
  const [step, setStep] = useState(0);
  const [platform, setPlatform] = useState<Platform>('web');

  useEffect(() => { setPlatform(detectPlatform()); }, []);
  useEffect(() => { if (isOpen) setStep(0); }, [isOpen]);

  if (!isOpen) return null;

  const totalSteps = 6;

  const handleNext = () => {
    if (step < totalSteps - 1) setStep(s => s + 1);
    else { markOnboardingComplete(); onClose(); }
  };
  const handleSkip = () => { markOnboardingComplete(); onClose(); };
  const handleBack = () => setStep(s => Math.max(0, s - 1));

  const PlatformIcon = platform === 'mac' ? Apple : platform === 'windows' ? Monitor : Globe;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header progress */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-200 dark:border-white/10 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">Welcome to Writely</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><PlatformIcon className="w-3 h-3" />{platform === 'mac' ? 'macOS • Apple Silicon & Intel' : platform === 'windows' ? 'Windows 10/11 • DirectML/Vulkan' : 'Web • PWA offline-ready'}</div>
              </div>
            </div>
            <button onClick={handleSkip} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i === step ? 'bg-indigo-600' : i < step ? 'bg-indigo-300 dark:bg-indigo-500/50' : 'bg-slate-200 dark:bg-white/10'}`} />
            ))}
            <span className="ml-2 text-[11px] font-mono text-slate-500">{step + 1}/{totalSteps}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your private Grammarly alternative</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Writely runs <strong className="text-slate-900 dark:text-white">100% offline</strong> — no keystrokes leave your device. <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium"><ShieldCheck className="w-3 h-3" />0% telemetry</span> vs Grammarly’s 300–500ms cloud round-trip.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-center"><Zap className="w-5 h-5 mx-auto text-amber-500 mb-1" /><div className="text-xs font-semibold">12–25ms</div><div className="text-[11px] text-slate-500">realtime</div></div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-center"><ShieldCheck className="w-5 h-5 mx-auto text-emerald-500 mb-1" /><div className="text-xs font-semibold">100% offline</div><div className="text-[11px] text-slate-500">private</div></div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-center"><BookOpen className="w-5 h-5 mx-auto text-indigo-500 mb-1" /><div className="text-xs font-semibold">Apache 2.0</div><div className="text-[11px] text-slate-500">free forever</div></div>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-200">
                <strong>How you’ll use it:</strong> Type in the editor → wavy underlines appear in &lt;50ms → click to fix → Fix All → tone rewrite → plagiarism/citations — all local.
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><Cpu className="w-5 h-5 text-indigo-600" />How Writely works</h2>
              <div className="space-y-2 font-mono text-xs bg-slate-950 text-slate-200 p-4 rounded-xl border border-slate-800">
                <div>Keystroke → <span className="text-emerald-400">FNV-1a Cache &lt;0.2ms</span> → <span className="text-amber-400">SymSpell &lt;2ms</span> → <span className="text-violet-400">GECToR Tagger &lt;15ms</span> → <span className="text-sky-400">Local LLM &lt;120ms</span></div>
                <div className="text-slate-500">All on-device. No network. Cache hit = 0ms.</div>
              </div>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1.5 list-disc pl-5">
                <li><strong>Editor:</strong> where you’re reading this — try typing “He go” and see the red underline.</li>
                <li><strong>Extension:</strong> same engine in Gmail/Notion via <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-white/5 font-mono text-xs">ws://127.0.0.1:8765</code> bridge (inline wavy marks, not just badge).</li>
                <li><strong>Models:</strong> 45 MB GECToR (grammar) + 350 MB Qwen (rewrites) in <code className="font-mono text-xs">~/.writely/models/</code> — download once.</li>
              </ul>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {platform === 'mac' ? 'macOS permissions — one-time setup' : platform === 'windows' ? 'Windows — no setup needed' : 'Web — no permissions needed'}
              </h2>
              {platform === 'mac' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400">For system-wide overlay (Slack/Word/Figma) and global hotkey <code className="font-mono text-xs px-1 py-0.5 bg-slate-100 dark:bg-white/5 rounded">Cmd+Shift+G</code>, grant:</p>
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5">
                      <div className="text-sm font-semibold">1. System Settings → Privacy & Security → Accessibility</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">Enable <strong>Writely</strong> (allows reading the sentence you’re editing — text never leaves your device).</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5">
                      <div className="text-sm font-semibold">2. Privacy & Security → Input Monitoring</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">Required only for global hotkey. Skip if you’ll use only the editor + browser extension.</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                    <strong>Privacy copy for the OS dialog:</strong> “Writely reads only the sentence you’re editing to correct locally. No text is sent to any server.” — You can use Writely without these; extension + editor work with zero permissions.
                  </div>
                </div>
              )}
              {platform === 'windows' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Windows needs <strong>no admin permission</strong>. Writely runs as a normal Tauri app:</p>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 list-disc pl-5 space-y-1">
                    <li>Tray icon → Writely runs in background, shows inline suggestions in any app via UI Automation.</li>
                    <li>SmartScreen may warn on first unsigned build: <em>More info → Run anyway</em> (resolved once EV cert added).</li>
                    <li>Fallback <strong>CPU SIMD</strong> works even without GPU/NPU — just slower (45–65ms vs 12–25ms).</li>
                  </ul>
                </div>
              )}
              {platform === 'web' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400">You’re on the <strong>web demo</strong> at <a href="https://balabenna.github.io/Writely/" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">balabenna.github.io/Writely</a> — zero install, PWA caches offline.</p>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5">
                    <div className="text-sm font-semibold">To get native speed + extension:</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Download <strong>.dmg</strong> (macOS) or <strong>.exe</strong> (Windows) from <a href="https://github.com/BalaBenna/Writely/releases/latest" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">Releases</a> or click Download above. Or run locally: <code className="font-mono text-xs px-1 py-0.5 bg-slate-100 dark:bg-white/5 rounded">npm i && npm run dev && npm run bridge</code> for the extension.</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><Settings2 className="w-5 h-5 text-indigo-600" />Set your writing goals</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Like Grammarly, Writely tailors suggestions to <strong>Audience × Formality × Domain × Intent</strong>.</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5"><div className="font-semibold">Audience</div><div className="text-slate-500">General / Knowledgeable / Expert — adjusts readability.</div></div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5"><div className="font-semibold">Formality</div><div className="text-slate-500">Informal / Neutral / Formal — slang tolerance.</div></div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5"><div className="font-semibold">Domain</div><div className="text-slate-500">Academic (strict, no contractions) / Business / Email / Casual / Creative (permissive).</div></div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5"><div className="font-semibold">Intent</div><div className="text-slate-500">Inform / Describe / Convince / Tell Story.</div></div>
              </div>
              <p className="text-xs text-slate-500">You can change this anytime above the editor (Goals bar). Try switching to <strong>Academic</strong> — “I think” and contractions will be flagged; <strong>Casual</strong> ignores fragments.</p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><Download className="w-5 h-5 text-indigo-600" />Models — download once, run forever offline</h2>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 flex items-center justify-between">
                  <div><div className="text-sm font-semibold">GECToR 80M INT8 — 45 MB</div><div className="text-xs text-slate-500">Realtime grammar & spell • 12–25ms • required</div></div>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium">Included</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 flex items-center justify-between">
                  <div><div className="text-sm font-semibold">Qwen 0.5B Q4 — 350 MB</div><div className="text-xs text-slate-500">Tone rewrite & paraphrase • 110–140ms • optional</div></div>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">Download in Models</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">Stored in <code className="font-mono text-xs px-1 py-0.5 bg-slate-100 dark:bg-white/5 rounded">~/.writely/models/</code> (or <code className="font-mono">~/Library/Application Support/Writely</code> on Mac). Delete anytime. No account.</p>
              <button onClick={() => { onGoToModels?.(); }} className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-sm font-medium flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />Open Model Catalog
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Try it — your turn</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">This text has 7 planted errors. Watch the wavy underlines and <strong>Fix All</strong>.</p>
              <div className="p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed border border-slate-800">
                He go to store yesterday. Their are many reason due to the fact that he don't have no money. In order to help, we is hoping you can fix this asap.
              </div>
              <ul className="text-xs text-slate-600 dark:text-slate-400 list-disc pl-5 space-y-1">
                <li>Hover an underline → see Why → <code className="font-mono">Cmd+Enter</code> to accept, <code className="font-mono">Esc</code> to dismiss.</li>
                <li>Click <strong>Fix All</strong> (top bar) — applies right-to-left safely.</li>
                <li>Try <strong>Tone Studio</strong> (Professional / Friendly / Concise) and <strong>/refund</strong> snippet.</li>
              </ul>
              <button onClick={() => { onGoToEditor?.(); }} className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />Open Editor & Start Writing
              </button>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-950/50">
          <button onClick={handleBack} disabled={step === 0} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-white/5 flex items-center gap-1.5">
            <ChevronLeft className="w-4 h-4" />Back
          </button>
          <div className="flex items-center gap-2">
            <button onClick={handleSkip} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Skip</button>
            <button onClick={handleNext} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-1.5">
              {step === totalSteps - 1 ? 'Get Started' : 'Next'}<ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
