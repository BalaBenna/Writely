import React, { useState, useEffect } from 'react';
import { BookA, Plus, Trash2, Search, Download } from 'lucide-react';
import { addToUserDictionary } from '../../engine/spell';

interface DictionaryViewProps {
  onWordChange?: () => void;
}

export const DictionaryView: React.FC<DictionaryViewProps> = ({ onWordChange }) => {
  const [words, setWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('writely_user_dict') || '[]');
        setWords(stored.sort());
      }
    } catch (_) {}
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newWord.trim().toLowerCase();
    if (!trimmed || words.includes(trimmed)) return;

    addToUserDictionary(trimmed);
    setNewWord('');
    loadWords();
    if (onWordChange) onWordChange();
  };

  const handleDelete = (word: string) => {
    try {
      const updated = words.filter((w) => w !== word);
      localStorage.setItem('writely_user_dict', JSON.stringify(updated));
      setWords(updated);
      if (onWordChange) onWordChange();
    } catch (_) {}
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(words, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'writely-user-dictionary.json';
    a.click();
  };

  const filtered = words.filter((w) => w.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-2xl transition-colors duration-200">
      {/* Header */}
      <div className="p-6 pb-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Personal Dictionary
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
              {words.length} custom words
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Words added to your personal dictionary will never be flagged as spelling errors.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            disabled={words.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-300 dark:border-white/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Add & Search Controls */}
      <div className="p-6 pb-2 space-y-4 max-w-4xl">
        <form onSubmit={handleAdd} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Add custom word, acronym, brand name, or terminology..."
              className="w-full bg-slate-50 dark:bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={!newWord.trim()}
            className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Word</span>
          </button>
        </form>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter dictionary words..."
            className="w-full bg-slate-50 dark:bg-slate-900/50 pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-white/5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Words Grid / List */}
      <div className="flex-1 overflow-y-auto p-6 pt-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <BookA className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2" />
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {words.length === 0 ? 'No custom words added yet' : 'No words match your filter'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Add custom names, jargon, or terms above to prevent them from being marked as typos.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-w-4xl">
            {filtered.map((word) => (
              <div
                key={word}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15 transition-all group"
              >
                <span className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate">
                  {word}
                </span>
                <button
                  onClick={() => handleDelete(word)}
                  className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:text-slate-500 dark:hover:text-red-400 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove word"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
