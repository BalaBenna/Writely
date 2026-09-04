import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppSidebar, NavScreen } from './components/Sidebar/AppSidebar';
import { WritelyEditor } from './components/Editor/WritelyEditor';
import { ModelCatalog } from './components/Models/ModelCatalog';
import { DictionaryView } from './components/Dictionary/DictionaryView';
import { HistoryView } from './components/History/HistoryView';
import { RewriteModal } from './components/Rewrite/RewriteModal';
import { ModelManagerModal } from './components/Models/ModelManagerModal';
import { DownloadModal } from './components/Download/DownloadModal';
import { SettingsModal } from './components/Settings/SettingsModal';
import { PlagiarismPanel } from './components/Plagiarism/PlagiarismPanel';
import { CitationsPanel } from './components/Citations/CitationsPanel';
import { DetectorPanel } from './components/Detector/DetectorPanel';
import { AnalyticsPanel } from './components/Analytics/AnalyticsPanel';
import { StyleGuidePanel } from './components/StyleGuide/StyleGuidePanel';
import { analyzeDocument } from './engine/hybridEngine';
import { addToUserDictionary } from './engine/spell';
import { Suggestion, DocumentMetrics, EngineTelemetry, WritingGoals, DEFAULT_GOALS } from './types';
import { GoalsBar } from './components/Goals/GoalsBar';
import { loadSnippets, expandSnippets } from './engine/styleGuide';
import { OnboardingWizard, hasCompletedOnboarding } from './components/Onboarding/OnboardingWizard';
import { SystemOverlay } from './components/System/SystemOverlay';
import { cloudManager } from './engine/cloudProviders';
import { runAssistantTab, reviseWithInstruction, AssistantTab } from './engine/selectionAssistant';

const INITIAL_TEXT = `He go to the store yesterday and bought three apple . Their are many reasons why this is a bad idea , due to the fact that he don't have no money . We is hoping that you can fix this asap .

In order to facilitate the project , we must at this point in time gather each and every member . Their going to lose they're car over their , and its a very unique problem .`;

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<NavScreen>('editor');
  const [text, setText] = useState<string>(INITIAL_TEXT);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [metrics, setMetrics] = useState<DocumentMetrics>({
    wordCount: 0,
    charCount: 0,
    charCountNoSpaces: 0,
    paragraphCount: 0,
    sentenceCount: 0,
    readingTimeMin: 1,
    readabilityScore: 75,
    gradeLevel: 'Standard',
    clarityScore: 92,
    avgWordsPerSentence: 0,
    longestSentenceWords: 0,
  });
  const [telemetry, setTelemetry] = useState<EngineTelemetry>({
    lastLatencyMs: 1.35,
    tokenizerMs: 0.1,
    engineMs: 1.25,
    cacheHit: false,
    activeModel: 'Writely GECToR 80M (INT8)',
    timestamp: Date.now(),
  });

  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);
  const [debounceMs, setDebounceMs] = useState<number>(80);
  const [goals, setGoals] = useState<WritingGoals>(() => {
    try {
      const saved = localStorage.getItem('writely_goals');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_GOALS;
  });

  useEffect(() => {
    try { localStorage.setItem('writely_goals', JSON.stringify(goals)); } catch {}
  }, [goals]);

  // Persistent Theme State — default to LIGHT on first open/download;
  // only honour an explicit saved preference afterwards.
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('writely_theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    try {
      localStorage.setItem('writely_theme', isDark ? 'dark' : 'light');
    } catch (_) {}
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Modals + Setup flow (user-activated, never auto-popup)
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isModelsModalOpen, setIsModelsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRewriteOpen, setIsRewriteOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  // First-run gate: the app stays behind full-screen setup until onboarding
  // completes (permissions seen + explicitly opted in or skipped by choice).
  const [onboarded, setOnboarded] = useState(() => hasCompletedOnboarding());

  const openSetup = (step = 0) => {
    setOnboardingStep(step);
    setIsOnboardingOpen(true);
  };
  const closeSetup = () => {
    setIsOnboardingOpen(false);
    setOnboarded(hasCompletedOnboarding());
  };

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Engine analysis runner — goals-aware
  const runAnalysis = useCallback((docText: string) => {
    const result = analyzeDocument(docText, goals);
    setSuggestions(result.suggestions);
    setMetrics(result.metrics);
    setTelemetry(result.telemetry);
  }, [goals]);

  // Debounced input handler (<80ms) — also expands /snippets
  const handleTextChange = (newText: string) => {
    const snippets = loadSnippets();
    const expanded = expandSnippets(newText, snippets);
    const finalText = expanded !== newText ? expanded : newText;
    setText(finalText);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      runAnalysis(finalText);
    }, debounceMs);
  };

  // Initial + goals-aware re-run
  useEffect(() => {
    runAnalysis(text);
  }, [runAnalysis]); // runs on mount and whenever goals change (runAnalysis identity changes)

  // System-wide pipeline: Main captures selected text from ANY app
  // (global hotkey ⌘/Ctrl+Shift+G) and asks the renderer to correct it
  // with the user's selected engine (local offline or cloud BYOK).
  useEffect(() => {
    const api = (window as any).writelySystem;
    if (!api?.onSystemCorrect) return;
    return api.onSystemCorrect(async (job: { original: string }) => {
      try {
        const input = String(job?.original || '');
        if (!input.trim()) {
          api.sendSystemResult({ corrected: input, count: 0, suggestions: [] });
          return;
        }
        const active = cloudManager.getActiveModelId();
        // Cloud engine (user's own key + selected model)
        if (active && active !== 'local' && active !== 'custom') {
          try {
            const g = await cloudManager.executeCloudGrammar(input, active);
            if (g.corrected && g.corrected !== input) {
              api.sendSystemResult({
                corrected: g.corrected,
                count: 1,
                suggestions: [{ original: input.slice(0, 120), replacement: g.corrected.slice(0, 120), explanation: `Corrected via ${g.providerUsed}`, type: 'grammar' }],
                providerUsed: g.providerUsed,
              });
              return;
            }
          } catch (_) {
            // fall through to local engine
          }
        }
        if (active === 'custom' && cloudManager.getCustomEndpoint().enabled) {
          try {
            const r = await cloudManager.executeCustomRewrite(input, 'professional');
            if (r.rewritten && r.rewritten !== input) {
              api.sendSystemResult({
                corrected: r.rewritten,
                count: 1,
                suggestions: [{ original: input.slice(0, 120), replacement: r.rewritten.slice(0, 120), explanation: `Via ${r.providerUsed}`, type: 'grammar' }],
                providerUsed: r.providerUsed,
              });
              return;
            }
          } catch (_) {}
        }
        // Local offline engine (default): same rule pipeline as the editor
        let savedGoals = DEFAULT_GOALS;
        try {
          const s = localStorage.getItem('writely_goals');
          if (s) savedGoals = JSON.parse(s);
        } catch (_) {}
        const result = analyzeDocument(input, savedGoals);
        const sorted = [...result.suggestions].sort((a, b) => b.start - a.start);
        let corrected = input;
        for (const s of sorted) {
          const slice = corrected.substring(s.start, s.end);
          if (slice === s.original) {
            corrected = corrected.substring(0, s.start) + s.replacement + corrected.substring(s.end);
          } else {
            const idx = corrected.indexOf(s.original);
            if (idx !== -1) corrected = corrected.substring(0, idx) + s.replacement + corrected.substring(idx + s.original.length);
          }
        }
        api.sendSystemResult({
          corrected,
          count: result.suggestions.length,
          suggestions: result.suggestions.slice(0, 8).map((s) => ({
            original: s.original,
            replacement: s.replacement,
            explanation: s.explanation,
            type: s.type,
          })),
        });
      } catch (e: any) {
        api.sendSystemResult({ error: e?.message || 'correction failed' });
      }
    });
  }, []);

  // Accept a single suggestion — clears debounce to prevent stale re-analysis
  const handleAcceptSuggestion = (s: Suggestion) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    // Guard: stale suggestion due to cache shift or typing — verify original matches current text
    const currentSlice = text.substring(s.start, s.end);
    if (currentSlice !== s.original) {
      // Try to re-locate by searching near original position (handles shifted offsets)
      const searchWindow = 40;
      const searchStart = Math.max(0, s.start - searchWindow);
      const searchEnd = Math.min(text.length, s.end + searchWindow);
      const windowText = text.substring(searchStart, searchEnd);
      const idx = windowText.indexOf(s.original);
      if (idx !== -1) {
        const newStart = searchStart + idx;
        const newEnd = newStart + s.original.length;
        const before2 = text.substring(0, newStart);
        const after2 = text.substring(newEnd);
        const updatedText2 = before2 + s.replacement + after2;
        setText(updatedText2);
        setActiveSuggestionId(null);
        runAnalysis(updatedText2);
        return;
      }
      // Fallback: re-analyze current text to refresh suggestions
      runAnalysis(text);
      return;
    }
    const before = text.substring(0, s.start);
    const after = text.substring(s.end);
    const updatedText = before + s.replacement + after;
    setText(updatedText);
    setActiveSuggestionId(null);
    runAnalysis(updatedText);
  };

  // Dismiss a suggestion
  const handleDismissSuggestion = (s: Suggestion) => {
    setSuggestions((prev) => prev.filter((item) => item.id !== s.id));
    if (activeSuggestionId === s.id) {
      setActiveSuggestionId(null);
    }
  };

  // Accept all suggestions at once (Right-to-Left replacement to avoid offset drift) — clears debounce
  const handleFixAll = () => {
    if (suggestions.length === 0) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const sorted = [...suggestions].sort((a, b) => b.start - a.start);
    let currentText = text;

    for (const s of sorted) {
      // Verify slice still matches before replacing (handles cache-shifted stale suggestions)
      const slice = currentText.substring(s.start, s.end);
      if (slice !== s.original) {
        const idx = currentText.indexOf(s.original);
        if (idx !== -1) {
          currentText = currentText.substring(0, idx) + s.replacement + currentText.substring(idx + s.original.length);
          continue;
        }
        continue; // skip stale
      }
      const before = currentText.substring(0, s.start);
      const after = currentText.substring(s.end);
      currentText = before + s.replacement + after;
    }

    setText(currentText);
    setActiveSuggestionId(null);
    runAnalysis(currentText);
  };

  // Add word to user dictionary
  const handleAddToDictionary = (word: string) => {
    addToUserDictionary(word);
    runAnalysis(text);
    setActiveSuggestionId(null);
  };

  // Apply rewrite
  const handleApplyRewrite = (rewritten: string) => {
    setText(rewritten);
    runAnalysis(rewritten);
  };

  // Overlay tab rewrites: the system-wide popup asks the renderer to
  // re-run a tab (tone) on the captured text via the shared assistant engine.
  useEffect(() => {
    const api = (window as any).writelySystem;
    if (!api?.onSystemRewrite) return;
    return api.onSystemRewrite(async (req: { id: number; text: string; tone: AssistantTab; instruction?: string; targetLang?: string }) => {
      try {
        const r = req?.instruction
          ? await reviseWithInstruction(String(req?.text || ''), req.instruction)
          : await runAssistantTab(String(req?.text || ''), (req?.tone as AssistantTab) || 'improve', req?.targetLang);
        api.sendSystemRewriteDone({ id: req?.id, ...r });
      } catch (e: any) {
        api.sendSystemRewriteDone({ id: req?.id, error: e?.message || 'rewrite failed' });
      }
    });
  }, []);

  // Overlay-popup mode: the frameless system-wide window loads the same
  // bundle with #system-overlay and renders ONLY the popup (no editor).
  if (typeof window !== 'undefined' && window.location.hash === '#system-overlay') {
    return <SystemOverlay />;
  }

  // First-run gate: full-screen permissions-first setup. The app appears
  // only after onboarding completes — permissions can no longer be skipped unseen.
  if (!onboarded) {
    return (
      <OnboardingWizard
        isOpen
        initialStep={1}
        forced
        onClose={closeSetup}
        onGoToModels={() => {
          closeSetup();
          setCurrentScreen('models');
        }}
        onGoToEditor={() => {
          closeSetup();
          setCurrentScreen('editor');
        }}
      />
    );
  }

  return (
    <div className={`h-screen flex overflow-hidden transition-colors duration-200 ${isDark ? 'dark bg-slate-950 text-slate-100' : 'light bg-slate-100 text-slate-900'}`}>
      {/* VoiceInk-style Native Desktop Sidebar */}
      <AppSidebar
        currentScreen={currentScreen}
        onSelectScreen={(screen) => setCurrentScreen(screen)}
        onOpenDownload={() => setIsDownloadOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRewrite={() => setIsRewriteOpen(true)}
        onOpenOnboarding={() => openSetup(0)}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Dynamic Screen Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {currentScreen === 'editor' && (
            <div className="max-w-7xl h-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Full-width: Interactive Writing Canvas */}
              <div className="lg:col-span-12 flex flex-col min-h-[550px] space-y-4">
                <GoalsBar goals={goals} onChange={setGoals} />
                <WritelyEditor
                  text={text}
                  onChange={handleTextChange}
                  suggestions={suggestions}
                  onAcceptSuggestion={handleAcceptSuggestion}
                  onDismissSuggestion={handleDismissSuggestion}
                  onAddToDictionary={handleAddToDictionary}
                  onFixAll={handleFixAll}
                  activeSuggestionId={activeSuggestionId}
                  setActiveSuggestionId={setActiveSuggestionId}
                />
              </div>

            </div>
          )}

          {currentScreen === 'models' && (
            <div className="max-w-6xl h-full mx-auto">
              <ModelCatalog onOpenSettings={() => setIsSettingsOpen(true)} />
            </div>
          )}

          {currentScreen === 'dictionary' && (
            <div className="max-w-6xl h-full mx-auto">
              <DictionaryView onWordChange={() => runAnalysis(text)} />
            </div>
          )}

          {currentScreen === 'history' && (
            <div className="max-w-6xl h-full mx-auto">
              <HistoryView
                currentText={text}
                onLoadDraft={(content) => {
                  setText(content);
                  runAnalysis(content);
                  setCurrentScreen('editor');
                }}
              />
            </div>
          )}

          {currentScreen === 'plagiarism' && (
            <div className="max-w-3xl mx-auto">
              <PlagiarismPanel currentText={text} corpus={(() => { try { return JSON.parse(localStorage.getItem('writely_saved_drafts') || '[]').map((d: any) => ({ id: d.id, title: d.title, content: d.content })); } catch { return []; } })()} />
            </div>
          )}

          {currentScreen === 'citations' && (
            <div className="max-w-3xl mx-auto">
              <CitationsPanel />
            </div>
          )}

          {currentScreen === 'detector' && (
            <div className="max-w-3xl mx-auto">
              <DetectorPanel text={text} onApplyHumanized={(t) => { setText(t); runAnalysis(t); setCurrentScreen('editor'); }} />
            </div>
          )}

          {currentScreen === 'analytics' && (
            <div className="max-w-3xl mx-auto">
              <AnalyticsPanel text={text} suggestionCount={suggestions.length} />
            </div>
          )}

          {currentScreen === 'styleguide' && (
            <div className="max-w-3xl mx-auto">
              <StyleGuidePanel />
            </div>
          )}
        </div>
      </div>

      {/* Global Modals */}
      <DownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        onStartSetup={(step) => {
          setIsDownloadOpen(false);
          openSetup(step);
        }}
      />

      <ModelManagerModal
        isOpen={isModelsModalOpen}
        onClose={() => setIsModelsModalOpen(false)}
      />

      <RewriteModal
        isOpen={isRewriteOpen}
        onClose={() => setIsRewriteOpen(false)}
        originalText={text}
        onApplyRewrite={handleApplyRewrite}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        debounceMs={debounceMs}
        setDebounceMs={setDebounceMs}
        onOpenStyleGuide={() => setCurrentScreen('styleguide')}
      />

      <OnboardingWizard
        isOpen={isOnboardingOpen}
        initialStep={onboardingStep}
        onClose={closeSetup}
        onGoToModels={() => { closeSetup(); setCurrentScreen('models'); }}
        onGoToEditor={() => { closeSetup(); setCurrentScreen('editor'); }}
      />
    </div>
  );
};
