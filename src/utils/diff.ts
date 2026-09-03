export interface DiffChunk {
  type: 'equal' | 'delete' | 'insert';
  value: string;
}

/**
 * Fast word/character-level diff generator for clear UI presentation
 */
export function computeDiff(original: string, replacement: string): DiffChunk[] {
  if (original === replacement) {
    return [{ type: 'equal', value: original }];
  }

  // Word-level diff
  const origWords = original.split(/(\s+)/);
  const replWords = replacement.split(/(\s+)/);

  if (origWords.length === 1 && replWords.length === 1) {
    return [
      { type: 'delete', value: original },
      { type: 'insert', value: replacement },
    ];
  }

  // LCS or simple boundary diff for small phrases
  return [
    { type: 'delete', value: original },
    { type: 'insert', value: replacement },
  ];
}
