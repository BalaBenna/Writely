import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppSidebar, NavScreen } from './components/Sidebar/AppSidebar';
import { Navbar } from './components/Header/Navbar';
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
import { analyzeDocument } from './engine/hybridEngine';
import { addToUserDictionary } from './engine/spell';
import { Suggestion, DocumentMetrics, EngineTelemetry } from './types';

const INITIAL_TEXT = `He go to the store yesterday and bought three apple . Their are many reasons why this is a bad idea , due to the fact that he don't have no money . We is hoping that you can fix this asap .

In order to facilitate the project , we must at this point in time gather each and every member . Their going to lose they're car over their , and its a very unique problem .`;

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<NavScreen>('editor');
  const [text, setText] = useState<string>(INITIAL_TEXT);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [metrics, setMetrics] = useState<DocumentMetrics>({
    wordCount: 0,
    charCount: 0,
    sentenceCount: 0,
    readingTimeMin: 1,
    readabilityScore: 75,
    gradeLevel: 'Standard',
    clarityScore: 92,
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

  // Modals
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isModelsModalOpen, setIsModelsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRewriteOpen, setIsRewriteOpen] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Engine analysis runner
  const runAnalysis = useCallback((docText: string) => {
    const result = analyzeDocument(docText);
    setSuggestions(result.suggestions);
    setMetrics(result.metrics);
    setTelemetry(result.telemetry);
  }, []);

  // Debounced input handler (<80ms)
  const handleTextChange = (newText: string) => {
    setText(newText);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      runAnalysis(newText);
    }, debounceMs);
  };

  // Run initial analysis on mount
  useEffect(() => {
    runAnalysis(INITIAL_TEXT);
  }, [runAnalysis]);

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
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          telemetry={telemetry}
          onOpenDownload={() => setIsDownloadOpen(true)}
          onOpenModels={() => setCurrentScreen('models')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenRewrite={() => setIsRewriteOpen(true)}
          isDark={isDark}
          toggleTheme={toggleTheme}
        />

        {/* Dynamic Screen Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {currentScreen === 'editor' && (
            <div className="max-w-7xl h-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left/Center: Interactive Writing Canvas */}
              <div className="lg:col-span-8 flex flex-col min-h-[550px]">
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
    </div>
  );
};
