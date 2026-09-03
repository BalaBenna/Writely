import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppSidebar, NavScreen } from './components/Sidebar/AppSidebar';
import { WritelyEditor } from './components/Editor/WritelyEditor';
import { IssuesPanel } from './components/Sidebar/IssuesPanel';
import { DocumentStats } from './components/Sidebar/DocumentStats';
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

  // Persistent Theme State
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('writely_theme');
      if (saved) return saved === 'dark';
    }
    return true;
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

  // Modals + Onboarding
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isModelsModalOpen, setIsModelsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRewriteOpen, setIsRewriteOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!hasCompletedOnboarding()) setIsOnboardingOpen(true);
    }, 600);
    return () => clearTimeout(t);
  }, []);

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

  // Accept a single suggestion
  const handleAcceptSuggestion = (s: Suggestion) => {
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

  // Accept all suggestions at once (Right-to-Left replacement to avoid offset drift)
  const handleFixAll = () => {
    if (suggestions.length === 0) return;

    const sorted = [...suggestions].sort((a, b) => b.start - a.start);
    let currentText = text;

    for (const s of sorted) {
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

  return (
    <div className={`h-screen flex overflow-hidden transition-colors duration-200 ${isDark ? 'dark bg-slate-950 text-slate-100' : 'light bg-slate-100 text-slate-900'}`}>
      {/* VoiceInk-style Native Desktop Sidebar */}
      <AppSidebar
        currentScreen={currentScreen}
        onSelectScreen={(screen) => setCurrentScreen(screen)}
        onOpenDownload={() => setIsDownloadOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRewrite={() => setIsRewriteOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Dynamic Screen Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {currentScreen === 'editor' && (
            <div className="max-w-7xl h-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left/Center: Interactive Writing Canvas */}
              <div className="lg:col-span-8 flex flex-col min-h-[550px] space-y-4">
                <GoalsBar goals={goals} onChange={setGoals} />
                {telemetry.tone && (
                  <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
                    <span className="text-base">{telemetry.tone.emoji}</span>
                    <span className="text-slate-200 font-medium">{telemetry.tone.overall}</span>
                    <span className="text-slate-500">— {telemetry.tone.description}</span>
                    <span className="ml-auto text-[11px] text-slate-500">{telemetry.tone.scores.formal ?? 0}% formal • {telemetry.tone.scores.confident ?? 0}% confident</span>
                  </div>
                )}
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

              {/* Right: Sidebar with Suggestions & Analytics */}
              <div className="lg:col-span-4 flex flex-col space-y-5">
                <div className="flex-1 min-h-[320px]">
                  <IssuesPanel
                    suggestions={suggestions}
                    onSelectSuggestion={(id) => setActiveSuggestionId(id)}
                    onAcceptSuggestion={handleAcceptSuggestion}
                    activeSuggestionId={activeSuggestionId}
                  />
                </div>

                <DocumentStats metrics={metrics} />
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
      />

      <OnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onGoToModels={() => { setIsOnboardingOpen(false); setCurrentScreen('models'); }}
        onGoToEditor={() => { setIsOnboardingOpen(false); setCurrentScreen('editor'); }}
      />
    </div>
  );
};
