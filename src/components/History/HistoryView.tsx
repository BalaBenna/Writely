import React, { useState, useEffect } from 'react';
import { History, Trash2, ArrowUpRight, Plus, Clock } from 'lucide-react';
import { SavedDraft } from '../../types';

interface HistoryViewProps {
  onLoadDraft: (content: string) => void;
  currentText: string;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onLoadDraft, currentText }) => {
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = JSON.parse(localStorage.getItem('writely_saved_drafts') || '[]');
        setDrafts(saved);
      }
    } catch (_) {}
  };

  const handleSaveCurrent = () => {
    if (!currentText.trim()) return;
    const title = currentText.trim().split('\n')[0].substring(0, 45) || 'Untitled Draft';
    const newDraft: SavedDraft = {
      id: `draft-${Date.now()}`,
      title,
      content: currentText,
      updatedAt: Date.now(),
      wordCount: currentText.trim().split(/\s+/).length,
    };

    const updated = [newDraft, ...drafts.filter((d) => d.content !== currentText)];
    localStorage.setItem('writely_saved_drafts', JSON.stringify(updated));
    setDrafts(updated);
  };

  const handleDelete = (id: string) => {
    const updated = drafts.filter((d) => d.id !== id);
    localStorage.setItem('writely_saved_drafts', JSON.stringify(updated));
    setDrafts(updated);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-2xl transition-colors duration-200">
      {/* Header */}
      <div className="p-6 pb-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Document History & Drafts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Revisit past writing sessions, revisions, and saved drafts.
          </p>
        </div>

        <button
          onClick={handleSaveCurrent}
          disabled={!currentText.trim()}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Save Current Text</span>
        </button>
      </div>

      {/* Drafts List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3 max-w-4xl">
        {drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <History className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2" />
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">No saved drafts yet</div>
            <div className="text-xs text-slate-500 mt-1">
              Click "Save Current Text" above to bookmark your writing revisions.
            </div>
          </div>
        ) : (
          drafts.map((draft) => (
            <div
              key={draft.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15 transition-all flex items-center justify-between gap-4 group"
            >
              <div className="space-y-1 flex-1">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{draft.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 font-mono">
                  {draft.content}
                </p>
                <div className="flex items-center space-x-3 text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(draft.updatedAt).toLocaleDateString()} at {new Date(draft.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                  <span>•</span>
                  <span>{draft.wordCount} words</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => onLoadDraft(draft.content)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-medium text-indigo-700 dark:text-indigo-300 transition-colors"
                >
                  <span>Open</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(draft.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors"
                  title="Delete draft"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
