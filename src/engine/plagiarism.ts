export interface PlagiarismMatch {
  sourceId: string;
  sourceTitle: string;
  similarity: number; // 0-100
  matchedNgrams: string[];
  excerpt: string;
}

function getNgrams(text: string, n = 5): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const grams = new Set<string>();
  for (let i = 0; i <= words.length - n; i++) {
    grams.add(words.slice(i, i + n).join(' '));
  }
  return grams;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const g of a) if (b.has(g)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export interface SavedDocForCheck { id: string; title: string; content: string; }

export function checkPlagiarismLocal(currentText: string, corpus: SavedDocForCheck[]): PlagiarismMatch[] {
  if (currentText.trim().split(/\s+/).length < 20) return [];
  const currentGrams = getNgrams(currentText, 5);
  if (currentGrams.size === 0) return [];
  const matches: PlagiarismMatch[] = [];
  for (const doc of corpus) {
    if (doc.content.trim() === currentText.trim()) continue;
    const docGrams = getNgrams(doc.content, 5);
    const sim = jaccard(currentGrams, docGrams);
    if (sim > 0.12) {
      const overlap: string[] = [];
      for (const g of currentGrams) if (docGrams.has(g)) { overlap.push(g); if (overlap.length >= 3) break; }
      matches.push({
        sourceId: doc.id,
        sourceTitle: doc.title,
        similarity: Math.round(sim * 100),
        matchedNgrams: overlap,
        excerpt: doc.content.slice(0, 160) + (doc.content.length > 160 ? '…' : ''),
      });
    }
  }
  return matches.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
}

export function selfPlagiarismScore(matches: PlagiarismMatch[]): number {
  if (matches.length === 0) return 0;
  return Math.max(...matches.map(m => m.similarity));
}
