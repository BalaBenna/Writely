import React, { useState, useEffect } from 'react';
import { Palette, Plus, Trash2, Save } from 'lucide-react';
import { loadStyleGuide, saveStyleGuide, loadSnippets, saveSnippets, StyleRule, Snippet } from '../../engine/styleGuide';

export const StyleGuidePanel: React.FC = () => {
  const [rules, setRules] = useState<StyleRule[]>(() => loadStyleGuide());
  const [snippets, setSnippets] = useState<Snippet[]>(() => loadSnippets());
  const [newTerm, setNewTerm] = useState('');
  const [newForbidden, setNewForbidden] = useState('');
  const [newTrigger, setNewTrigger] = useState('');
  const [newContent, setNewContent] = useState('');

  useEffect(() => saveStyleGuide(rules), [rules]);
  useEffect(() => saveSnippets(snippets), [snippets]);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-3">
        <div className="flex items-center gap-2"><Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /><h2 className="font-bold text-slate-900 dark:text-white">Style Guide — Offline Brand Rules</h2></div>
        <p className="text-xs text-slate-600 dark:text-slate-400">Grammarly Style Guide is $15–33/user/mo cloud. Writely’s is a local JSON file — import/export to share with team via git.</p>
        <div className="flex gap-2">
          <input value={newTerm} onChange={e => setNewTerm(e.target.value)} placeholder="Preferred term (e.g. Writely)" className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-sm" />
          <input value={newForbidden} onChange={e => setNewForbidden(e.target.value)} placeholder="Forbidden alt (e.g. writely)" className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-sm" />
          <button onClick={() => { if (!newTerm) return; setRules([...rules, { id: Date.now().toString(), term: newTerm, forbidden: newForbidden ? [newForbidden] : undefined }]); setNewTerm(''); setNewForbidden(''); }} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm flex items-center gap-1"><Plus className="w-4 h-4" />Add</button>
        </div>
        <div className="space-y-2">
          {rules.map(r => (
            <div key={r.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5">
              <div><div className="text-sm font-semibold">{r.term}</div><div className="text-xs text-slate-500">{r.description || (r.forbidden ? `flag: ${r.forbidden.join(', ')}` : 'convention')}</div></div>
              <button onClick={() => setRules(rules.filter(x => x.id !== r.id))} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-3">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Save className="w-4 h-4" />Snippets — /trigger → template</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400">Type <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 font-mono">/refund</code> in editor to expand. Grammarly Snippets is Enterprise-only; this is local.</p>
        <div className="flex gap-2">
          <input value={newTrigger} onChange={e => setNewTrigger(e.target.value)} placeholder="/trigger" className="w-28 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-sm font-mono" />
          <input value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Template content" className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-sm" />
          <button onClick={() => { if (!newTrigger || !newContent) return; setSnippets([...snippets, { trigger: newTrigger.startsWith('/') ? newTrigger : `/${newTrigger}`, content: newContent }]); setNewTrigger(''); setNewContent(''); }} className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm">Add</button>
        </div>
        <div className="space-y-2">
          {snippets.map(s => (
            <div key={s.trigger} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5">
              <div><div className="text-sm font-mono font-semibold">{s.trigger}</div><div className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[28ch]">{s.content}</div></div>
              <button onClick={() => setSnippets(snippets.filter(x => x.trigger !== s.trigger))} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => { const blob = new Blob([JSON.stringify({ rules, snippets }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'writely-style-guide.json'; a.click(); URL.revokeObjectURL(url); }} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5">Export JSON</button>
          <label className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer">Import JSON<input type="file" accept=".json" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { const d = JSON.parse(r.result as string); if (d.rules) setRules(d.rules); if (d.snippets) setSnippets(d.snippets); } catch {} }; r.readAsText(f); }} /></label>
        </div>
      </div>
    </div>
  );
};
