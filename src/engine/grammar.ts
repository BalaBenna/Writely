import { Suggestion } from '../types';

interface GrammarRule {
  id: string;
  pattern: RegExp;
  type: 'grammar' | 'clarity' | 'tone';
  replacement: string | ((match: string, ...groups: string[]) => string);
  explanation: string | ((match: string, ...groups: string[]) => string);
  confidence: number;
}

const GRAMMAR_RULES: GrammarRule[] = [
  // 1. Subject-Verb Agreement
  {
    id: 'SVA_HE_GO',
    pattern: /\b(he|she|it)\s+(go)\b/i,
    type: 'grammar',
    replacement: (_match, subj) => `${subj} goes`,
    explanation: 'Subject-verb agreement: third-person singular pronouns take "goes".',
    confidence: 0.99,
  },
  {
    id: 'SVA_THEY_IS',
    pattern: /\b(they|we|you)\s+(is)\b/i,
    type: 'grammar',
    replacement: (_match, subj) => `${subj} are`,
    explanation: 'Subject-verb agreement: plural pronouns take "are".',
    confidence: 0.99,
  },
  {
    id: 'SVA_HE_DONT',
    pattern: /\b(he|she|it)\s+(don't|dont)\b/i,
    type: 'grammar',
    replacement: (_match, subj) => `${subj} doesn't`,
    explanation: 'Use "doesn\'t" for third-person singular subjects.',
    confidence: 0.98,
  },
  {
    id: 'SVA_DOES_HAVE',
    pattern: /\b(he|she|it)\s+(have)\b/i,
    type: 'grammar',
    replacement: (_match, subj) => `${subj} has`,
    explanation: 'Third-person singular pronouns take "has" instead of "have".',
    confidence: 0.95,
  },
  {
    id: 'DOUBLE_PAST_DID_WENT',
    pattern: /\b(did\s+went)\b/i,
    type: 'grammar',
    replacement: 'went',
    explanation: 'Avoid double past tense. Use the past form alone ("went") or auxiliary with base form ("did go").',
    confidence: 0.96,
  },

  // 2. Commonly Confused Words
  {
    id: 'CONFUSED_THEIR_ARE',
    pattern: /\b(their)\s+(are|is|were|was)\b/i,
    type: 'grammar',
    replacement: (_match, _th, verb) => `there ${verb}`,
    explanation: 'Did you mean "there" indicating existence, rather than the possessive "their"?',
    confidence: 0.97,
  },
  {
    id: 'CONFUSED_OVER_THEIR',
    pattern: /\b(over|in|at)\s+(their)\b/i,
    type: 'grammar',
    replacement: (_match, prep) => `${prep} there`,
    explanation: 'Use "there" for location or direction.',
    confidence: 0.92,
  },
  {
    id: 'CONFUSED_THEYRE_NOUN',
    pattern: /\bthey're\s+(car|house|team|book|work|money|idea|code|time|laptop)\b/i,
    type: 'grammar',
    replacement: (_match, noun) => `their ${noun}`,
    explanation: 'Use possessive "their" before a noun instead of the contraction "they\'re" (they are).',
    confidence: 0.98,
  },
  {
    id: 'CONFUSED_ITS_A',
    pattern: /\b(its)\s+(a|an|the|very|important|obvious|clear|going)\b/i,
    type: 'grammar',
    replacement: (_match, _its, next) => `it's ${next}`,
    explanation: 'Contraction of "it is" requires an apostrophe: "it\'s".',
    confidence: 0.96,
  },
  {
    id: 'CONFUSED_ITS_POSSESSIVE',
    pattern: /\bit's\s+(own|name|color|shape|weight|price|speed|features|tail)\b/i,
    type: 'grammar',
    replacement: (_match, noun) => `its ${noun}`,
    explanation: 'Possessive "its" does not have an apostrophe.',
    confidence: 0.97,
  },
  {
    id: 'CONFUSED_THAN_THEN',
    pattern: /\b(better|more|less|greater|faster|slower|easier|harder|rather)\s+then\b/i,
    type: 'grammar',
    replacement: (_match, comp) => `${comp} than`,
    explanation: 'Use "than" for comparisons, not "then" (time sequence).',
    confidence: 0.98,
  },
  {
    id: 'CONFUSED_YOUR_WELCOME',
    pattern: /\byour\s+welcome\b/i,
    type: 'grammar',
    replacement: "you're welcome",
    explanation: 'Use the contraction "you\'re" (you are) in "you\'re welcome".',
    confidence: 0.99,
  },
  {
    id: 'CONFUSED_AFFECT_EFFECT',
    pattern: /\bside\s+affects?\b/i,
    type: 'grammar',
    replacement: 'side effects',
    explanation: '"Effect" is the noun meaning a result; "side effect" is the standard term.',
    confidence: 0.98,
  },
  {
    id: 'CONFUSED_LOOSE_LOSE',
    pattern: /\b(loose)\s+(your|the|weight|control|mind|keys|money)\b/i,
    type: 'grammar',
    replacement: (_match, _l, next) => `lose ${next}`,
    explanation: '"Lose" means to be deprived of something; "loose" means not tight.',
    confidence: 0.96,
  },

  // 3. Conciseness & Redundancy
  {
    id: 'CONCISE_IN_ORDER_TO',
    pattern: /\bin\s+order\s+to\b/i,
    type: 'clarity',
    replacement: 'to',
    explanation: 'Simplify: "in order to" can be shortened to "to" with no loss of meaning.',
    confidence: 0.95,
  },
  {
    id: 'CONCISE_AT_THIS_POINT',
    pattern: /\bat\s+this\s+point\s+in\s+time\b/i,
    type: 'clarity',
    replacement: 'now',
    explanation: 'Wordy phrasing: consider using "now" or "currently".',
    confidence: 0.96,
  },
  {
    id: 'CONCISE_DUE_TO_FACT',
    pattern: /\bdue\s+to\s+the\s+fact\s+that\b/i,
    type: 'clarity',
    replacement: 'because',
    explanation: 'Wordiness: "due to the fact that" is bloated. Use "because".',
    confidence: 0.98,
  },
  {
    id: 'CONCISE_HAS_ABILITY',
    pattern: /\bhas\s+the\s+ability\s+to\b/i,
    type: 'clarity',
    replacement: 'can',
    explanation: 'Replace "has the ability to" with the direct verb "can".',
    confidence: 0.95,
  },
  {
    id: 'CONCISE_IN_EVENT_THAT',
    pattern: /\bin\s+the\s+event\s+that\b/i,
    type: 'clarity',
    replacement: 'if',
    explanation: 'Replace wordy "in the event that" with "if".',
    confidence: 0.95,
  },
  {
    id: 'CONCISE_PERIOD_OF_TIME',
    pattern: /\bperiod\s+of\s+time\b/i,
    type: 'clarity',
    replacement: 'period',
    explanation: 'Redundant phrasing: "period" already denotes a span of time.',
    confidence: 0.94,
  },
  {
    id: 'CONCISE_EACH_AND_EVERY',
    pattern: /\beach\s+and\s+every\b/i,
    type: 'clarity',
    replacement: 'every',
    explanation: 'Tautology: "each and every" is redundant. Use either "each" or "every".',
    confidence: 0.95,
  },

  // 4. Tone & Politeness
  {
    id: 'TONE_VERY_UNIQUE',
    pattern: /\b(very|extremely|most)\s+unique\b/i,
    type: 'tone',
    replacement: 'unique',
    explanation: '"Unique" is an absolute term and cannot be qualified by degree.',
    confidence: 0.92,
  },
  {
    id: 'TONE_ASAP',
    pattern: /\basap\b/i,
    type: 'tone',
    replacement: 'as soon as possible',
    explanation: 'In professional writing, spell out "as soon as possible" or give a specific deadline.',
    confidence: 0.88,
  },

  // 5. Mechanics & Spacing
  {
    id: 'PUNCT_SPACE_BEFORE_COMMA',
    pattern: /\s+,/g,
    type: 'grammar',
    replacement: ',',
    explanation: 'Remove extraneous space before the comma.',
    confidence: 0.99,
  },
  {
    id: 'PUNCT_DOUBLE_PERIOD',
    pattern: /\.{2}(?!\.)/g,
    type: 'grammar',
    replacement: '.',
    explanation: 'Double period detected. Use a single period or an ellipsis ("...").',
    confidence: 0.98,
  },
  {
    id: 'PUNCT_SPACE_BEFORE_PERIOD',
    pattern: /\s+\./g,
    type: 'grammar',
    replacement: '.',
    explanation: 'Remove unnecessary space before the period.',
    confidence: 0.99,
  },
];

/**
 * Fast non-autoregressive grammar tagger (<15ms)
 */
export function checkGrammar(
  sentenceText: string,
  sentenceOffset: number,
  sentenceIndex: number
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Check 1: Sentence capitalization
  const firstCharMatch = /^[a-z]/.exec(sentenceText.trimStart());
  if (firstCharMatch) {
    const leadSpaces = sentenceText.length - sentenceText.trimStart().length;
    const charIndex = sentenceOffset + leadSpaces;
    const originalChar = firstCharMatch[0];
    suggestions.push({
      id: `cap-${charIndex}`,
      type: 'grammar',
      original: originalChar,
      replacement: originalChar.toUpperCase(),
      explanation: 'Sentences must begin with a capital letter.',
      start: charIndex,
      end: charIndex + 1,
      sentenceIndex,
      ruleId: 'CAPITALIZATION_START',
      confidence: 0.99,
    });
  }

  // Check 2: Pattern-based rules
  for (const rule of GRAMMAR_RULES) {
    const flags = rule.pattern.flags.includes('g') ? rule.pattern.flags : rule.pattern.flags + 'g';
    const regex = new RegExp(rule.pattern.source, flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(sentenceText)) !== null) {
      const matchText = match[0];
      const matchStart = sentenceOffset + match.index;
      const matchEnd = matchStart + matchText.length;

      let replacement = '';
      if (typeof rule.replacement === 'function') {
        replacement = rule.replacement(matchText, ...(match.slice(1)));
      } else {
        replacement = rule.replacement;
      }

      // Preserve initial capitalization if needed
      if (matchText[0] === matchText[0].toUpperCase() && replacement.length > 0) {
        replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }

      let explanation = '';
      if (typeof rule.explanation === 'function') {
        explanation = rule.explanation(matchText, ...(match.slice(1)));
      } else {
        explanation = rule.explanation;
      }

      suggestions.push({
        id: `gram-${matchStart}-${matchEnd}-${rule.id}`,
        type: rule.type,
        original: matchText,
        replacement,
        explanation,
        start: matchStart,
        end: matchEnd,
        sentenceIndex,
        ruleId: rule.id,
        confidence: rule.confidence,
      });
    }
  }

  return suggestions;
}
