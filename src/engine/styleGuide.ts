export interface StyleRule {
  id: string;
  term: string; // preferred casing/spelling
  forbidden?: string[]; // alternatives to flag
  description?: string;
}

export interface Snippet {
  trigger: string; // e.g. /refund
  content: string;
  description?: string;
}

const LS_STYLE = 'writely_style_guide';
const LS_SNIPPETS = 'writely_snippets';

export function loadStyleGuide(): StyleRule[] {
  try {
    const raw = localStorage.getItem(LS_STYLE);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    { id: 'sg-writely', term: 'Writely', forbidden: ['writely', 'WRITELY', 'Writely AI'], description: 'Brand name is Writely' },
    { id: 'sg-oxford', term: 'Oxford comma', description: 'Use Oxford comma in lists' },
  ];
}

export function saveStyleGuide(rules: StyleRule[]) {
  localStorage.setItem(LS_STYLE, JSON.stringify(rules));
}

export function loadSnippets(): Snippet[] {
  try {
    const raw = localStorage.getItem(LS_SNIPPETS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    { trigger: '/refund', content: 'Thanks for reaching out — happy to help with your refund. …', description: 'Customer refund template' },
    { trigger: '/intro', content: 'Hi — I’m with Writely, the privacy-first writing assistant. …', description: 'Intro blurb' },
  ];
}

export function saveSnippets(snippets: Snippet[]) {
  localStorage.setItem(LS_SNIPPETS, JSON.stringify(snippets));
}

export function checkStyleGuide(text: string, rules: StyleRule[]): { start: number; end: number; term: string; suggestion: string }[] {
  const hits: { start: number; end: number; term: string; suggestion: string }[] = [];
  for (const r of rules) {
    if (!r.forbidden) continue;
    for (const f of r.forbidden) {
      const re = new RegExp(`\\b${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      let m;
      while ((m = re.exec(text)) !== null) {
        hits.push({ start: m.index, end: m.index + m[0].length, term: f, suggestion: r.term });
      }
    }
  }
  return hits;
}

export function expandSnippets(text: string, snippets: Snippet[]): string {
  let out = text;
  for (const s of snippets) {
    if (out.includes(s.trigger)) out = out.split(s.trigger).join(s.content);
  }
  return out;
}
