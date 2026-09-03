import React, { useState } from 'react';
import { BookMarked, Search, Copy, Check } from 'lucide-react';
import { CitationInput, CitationStyle, formatCitation, generateInTextCitation, lookupCrossref } from '../../engine/citations';

export const CitationsPanel: React.FC = () => {
  const [form, setForm] = useState<CitationInput>({ authors: 'Doe, J.', title: 'Example Paper', source: 'Journal of Examples', year: '2024', url: '' });
  const [style, setStyle] = useState<CitationStyle>('apa');
  const [copied, setCopied] = useState(false);
  const [lookupQ, setLookupQ] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  const citation = formatCitation(form, style);
  const inText = generateInTextCitation(form.authors, form.year, style);

  const handleLookup = async () => {
    if (!lookupQ.trim()) return;
    setLookupLoading(true);
    const res = await lookupCrossref(lookupQ);
    if (res) setForm({ authors: res.authors, title: res.title, source: 'Crossref', year: res.year, doi: res.doi });
    setLookupLoading(false);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-3">
        <div className="flex items-center gap-2"><BookMarked className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /><h2 className="font-bold text-slate-900 dark:text-white">Citation Generator — APA / MLA / Chicago</h2></div>
        <p className="text-xs text-slate-600 dark:text-slate-400">100% offline formatting via CSL. Crossref lookup is opt-in cloud (fetch to api.crossref.org).</p>

        <div className="flex gap-2">
          <input value={lookupQ} onChange={e => setLookupQ(e.target.value)} placeholder="Search Crossref by title/DOI…" className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-sm" />
          <button onClick={handleLookup} disabled={lookupLoading} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"><Search className="w-4 h-4" />{lookupLoading ? '…' : 'Lookup'}</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input placeholder="Authors (Doe, J.)" value={form.authors} onChange={e => setForm({ ...form, authors: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-sm" />
          <input placeholder="Year" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-sm" />
          <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-sm" />
          <input placeholder="Journal / Website" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-sm" />
          <input placeholder="URL (optional)" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-sm" />
          <input placeholder="DOI (optional)" value={form.doi || ''} onChange={e => setForm({ ...form, doi: e.target.value })} className="col-span-2 sm:col-span-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-sm" />
          <select value={style} onChange={e => setStyle(e.target.value as CitationStyle)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-sm">
            <option value="apa">APA</option><option value="mla">MLA</option><option value="chicago">Chicago</option>
          </select>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 space-y-2">
          <div className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">Formatted citation</div>
          <div className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed">{citation}</div>
          <button onClick={() => copy(citation)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium">{copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? 'Copied' : 'Copy citation'}</button>
          <div className="text-xs text-slate-500">In-text: <span className="font-mono font-semibold">{inText}</span> <button onClick={() => copy(inText)} className="ml-2 underline">copy</button></div>
        </div>
      </div>
    </div>
  );
};
