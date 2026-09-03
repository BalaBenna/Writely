export type CitationStyle = 'apa' | 'mla' | 'chicago';

export interface CitationInput {
  authors: string; // "Doe, J." or "Doe, John"
  title: string;
  source: string; // journal / website
  year: string;
  url?: string;
  doi?: string;
}

export function formatCitation(input: CitationInput, style: CitationStyle): string {
  const { authors, title, source, year, url, doi } = input;
  const clean = (s: string) => s.trim().replace(/\.$/, '');
  if (style === 'apa') {
    // Doe, J. (2023). Title. Source. https://...
    let c = `${clean(authors)} (${year}). ${clean(title)}.`;
    if (source) c += ` *${clean(source)}*.`;
    if (doi) c += ` https://doi.org/${doi}`;
    else if (url) c += ` ${url}`;
    return c;
  }
  if (style === 'mla') {
    // Doe, John. "Title." Source, 2023, URL.
    let c = `${clean(authors)}. "${clean(title)}."`;
    if (source) c += ` *${clean(source)}*,`;
    c += ` ${year}.`;
    if (url) c += ` ${url}.`;
    if (doi) c += ` doi:${doi}.`;
    return c;
  }
  // chicago
  let c = `${clean(authors)}. "${clean(title)}."`;
  if (source) c += ` *${clean(source)}*`;
  c += ` (${year}).`;
  if (url) c += ` ${url}.`;
  if (doi) c += ` doi:${doi}.`;
  return c;
}

export function generateInTextCitation(authors: string, year: string, style: CitationStyle): string {
  const lastName = authors.split(',')[0].trim() || authors;
  if (style === 'apa') return `(${lastName}, ${year})`;
  if (style === 'mla') return `(${lastName} ${year})`;
  return `(${lastName} ${year})`;
}

// Crossref lookup stub (opt-in cloud) — keep offline-first; this is fetch wrapper
export async function lookupCrossref(query: string): Promise<{ title: string; authors: string; year: string; doi?: string } | null> {
  try {
    const res = await fetch(`https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=1`);
    if (!res.ok) return null;
    const data = await res.json();
    const item = data.message?.items?.[0];
    if (!item) return null;
    const title = (item.title?.[0] || query).slice(0, 120);
    const authors = (item.author || []).map((a: any) => `${a.family}, ${a.given?.[0] || ''}.`).join(', ') || 'Unknown';
    const year = item.issued?.['date-parts']?.[0]?.[0]?.toString() || new Date().getFullYear().toString();
    const doi = item.DOI;
    return { title, authors, year, doi };
  } catch { return null; }
}
