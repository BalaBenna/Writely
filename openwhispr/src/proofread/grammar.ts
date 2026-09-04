import { Suggestion, WritingGoals, DEFAULT_GOALS } from './proofreadTypes';

interface GrammarRule {
  id: string;
  pattern: RegExp;
  type: 'grammar' | 'clarity' | 'tone';
  replacement: string | ((match: string, ...groups: string[]) => string);
  explanation: string | ((match: string, ...groups: string[]) => string);
  confidence: number;
  domains?: string[];
  skipDomains?: string[];
  formality?: string[];
}

// Common countable nouns for noun-number rules (singular → plural)
const COUNTABLE_SINGULAR_TO_PLURAL: Record<string, string> = {
  apple: 'apples', reason: 'reasons', member: 'members', car: 'cars',
  problem: 'problems', day: 'days', year: 'years', thing: 'things',
  book: 'books', idea: 'ideas', meeting: 'meetings', email: 'emails',
  student: 'students', employee: 'employees', mile: 'miles', dollar: 'dollars',
  hour: 'hours', minute: 'minutes', week: 'weeks', month: 'months',
  point: 'points', step: 'steps', part: 'parts', way: 'ways',
  phone: 'phones', computer: 'computers', file: 'files', word: 'words',
  page: 'pages', photo: 'photos', bottle: 'bottles', box: 'boxes',
  child: 'children', man: 'men', woman: 'women', person: 'people',
};
const PLURAL_TO_SINGULAR: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTABLE_SINGULAR_TO_PLURAL).map(([s, p]) => [p, s])
);

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
  {
    id: 'PUNCT_DOUBLE_SPACE',
    pattern: / {2,}/g,
    type: 'grammar',
    replacement: ' ',
    explanation: 'Multiple spaces detected. Use a single space.',
    confidence: 0.98,
  },
  {
    id: 'PUNCT_COMMA_SPLICE_THEN',
    pattern: /,\s*then\b/i,
    type: 'clarity',
    replacement: '. Then',
    explanation: 'Comma splice: use a period or semicolon before "then" to separate independent clauses.',
    confidence: 0.85,
  },

  // 6. Articles & Determiners
  {
    id: 'ARTICLE_A_BEFORE_VOWEL',
    pattern: /\b(a)\s+([aeiou][a-z]*)\b/gi,
    type: 'grammar',
    replacement: (_m, _a, word) => {
      const vowelWords = ['hour', 'honest', 'honor', 'heir', 'herb'];
      if (vowelWords.includes(word.toLowerCase())) return `an ${word}`;
      return `an ${word}`;
    },
    explanation: 'Use "an" before vowel sounds.',
    confidence: 0.92,
  },
  {
    id: 'ARTICLE_AN_BEFORE_CONSONANT',
    pattern: /\b(an)\s+([bcdfghjklmnpqrstvwxyz][a-z]*)\b/gi,
    type: 'grammar',
    replacement: (_m, _an, word) => {
      const silentH = ['hour', 'honest', 'honor', 'heir', 'herb'];
      if (silentH.includes(word.toLowerCase())) return `an ${word}`;
      const consonantSound = ['university', 'uniform', 'unicorn', 'unique', 'user', 'unit', 'european', 'one', 'once'];
      if (consonantSound.includes(word.toLowerCase())) return `a ${word}`;
      return `a ${word}`;
    },
    explanation: 'Use "a" before consonant sounds (including "university" pronounced "yoo-").',
    confidence: 0.88,
  },
  {
    id: 'ARTICLE_A_AN_HOUR',
    pattern: /\b(a)\s+(hour|honest|honor|heir)\b/gi,
    type: 'grammar',
    replacement: (_m, _a, word) => `an ${word}`,
    explanation: '"H" is silent in this word — use "an".',
    confidence: 0.96,
  },

  // 7. Tense & Verb Forms
  {
    id: 'TENSE_HAS_WENT',
    pattern: /\b(has|have|had)\s+went\b/gi,
    type: 'grammar',
    replacement: (_m, aux) => `${aux} gone`,
    explanation: 'Use "gone" as past participle with have/has/had ("has gone", not "has went").',
    confidence: 0.96,
  },
  {
    id: 'TENSE_DID_WENT2',
    pattern: /\bdid\s+(went|gone|came|done)\b/gi,
    type: 'grammar',
    replacement: (_m, verb) => {
      const base: Record<string, string> = { went: 'go', gone: 'go', came: 'come', done: 'do' };
      return `did ${base[verb.toLowerCase()] || verb}`;
    },
    explanation: 'With auxiliary "did", use base form ("did go", not "did went").',
    confidence: 0.97,
  },
  {
    id: 'TENSE_HAVE_DID',
    pattern: /\b(have|has)\s+did\b/gi,
    type: 'grammar',
    replacement: (_m, aux) => `${aux} done`,
    explanation: 'Use past participle "done" with has/have.',
    confidence: 0.96,
  },
  {
    id: 'SVA_I_IS',
    pattern: /\bI\s+is\b/g,
    type: 'grammar',
    replacement: 'I am',
    explanation: 'First person takes "am", not "is".',
    confidence: 0.99,
  },
  {
    id: 'SVA_WE_WAS',
    pattern: /\b(we|you|they)\s+was\b/gi,
    type: 'grammar',
    replacement: (_m, subj) => `${subj} were`,
    explanation: 'Plural subjects take "were", not "was".',
    confidence: 0.98,
  },
  {
    id: 'SVA_I_HAS',
    pattern: /\bI\s+has\b/g,
    type: 'grammar',
    replacement: 'I have',
    explanation: 'Use "have" with "I".',
    confidence: 0.99,
  },

  // 8. Double Negatives
  {
    id: 'DOUBLE_NEG_DONT_NO',
    pattern: /\b(don't|doesn't|didn't|can't|cannot|won't|shouldn't)\s+have\s+no\b/gi,
    type: 'grammar',
    replacement: (_m, aux) => `${aux} have any`,
    explanation: 'Double negative: use "any" instead of "no" with a negative auxiliary.',
    confidence: 0.94,
  },
  {
    id: 'DOUBLE_NEG_NEVER_NO',
    pattern: /\bnever\s+have\s+no\b/gi,
    type: 'grammar',
    replacement: 'never have any',
    explanation: 'Double negative — use "any" after a negative.',
    confidence: 0.94,
  },
  {
    id: 'DOUBLE_NEG_CANT_NO',
    pattern: /\bcan't\s+get\s+no\b/gi,
    type: 'grammar',
    replacement: "can't get any",
    explanation: 'Double negative detected.',
    confidence: 0.95,
  },

  // 9. Passive Voice (flag as clarity, allow in academic per domain? flagged everywhere but softer in academic)
  {
    id: 'PASSIVE_BEEN_DONE',
    pattern: /\b(is|are|was|were|be|been|being)\s+(done|made|created|written|shown|given|taken|found|known|seen|called|considered|expected|required)\b/gi,
    type: 'clarity',
    replacement: (_m) => _m,
    explanation: 'Passive voice — consider active voice for stronger, clearer writing.',
    confidence: 0.72,
  },

  // 10. Contractions (domain-aware: flagged in academic/business)
  {
    id: 'CONTRACTION_DONT_ACADEMIC',
    pattern: /\b(don't|can't|won't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|wouldn't|shouldn't|couldn't)\b/gi,
    type: 'tone',
    replacement: (_m) => _m,
    explanation: 'Contraction may be too informal for academic/business writing. Consider the full form ("do not", "cannot").',
    confidence: 0.70,
    domains: ['academic', 'business'],
  },
  {
    id: 'INFORMAL_PRONOUN_ACADEMIC',
    pattern: /\b(I think|I believe|you can see|in my opinion)\b/gi,
    type: 'tone',
    replacement: (_m) => _m,
    explanation: 'Informal pronoun/phrasing flagged for academic domain. Consider more objective phrasing.',
    confidence: 0.68,
    domains: ['academic'],
  },

  // 11. Wordiness & Redundancy (expanded)
  {
    id: 'WORDY_BASICALLY',
    pattern: /\bbasically\b/gi,
    type: 'clarity',
    replacement: '',
    explanation: 'Filler word: removing "basically" often strengthens the sentence.',
    confidence: 0.75,
  },
  {
    id: 'WORDY_ACTUALLY',
    pattern: /\bactually\b/gi,
    type: 'clarity',
    replacement: '',
    explanation: 'Filler: "actually" can often be removed without loss.',
    confidence: 0.72,
  },
  {
    id: 'WORDY_VERY_REALLY',
    pattern: /\b(very|really)\s+(good|bad|important|interesting|big|small|large)\b/gi,
    type: 'clarity',
    replacement: (_m, _adv, adj) => adj,
    explanation: 'Weak intensifier — use a stronger adjective or remove.',
    confidence: 0.78,
  },
  {
    id: 'WORDY_REPEAT_REASON',
    pattern: /\bthe\s+reason\s+why\b/gi,
    type: 'clarity',
    replacement: 'the reason',
    explanation: 'Redundant: "the reason why" → "the reason".',
    confidence: 0.88,
  },
  {
    id: 'WORDY_FUTURE_PLANS',
    pattern: /\bfuture\s+plans\b/gi,
    type: 'clarity',
    replacement: 'plans',
    explanation: 'Redundant: plans are by definition future.',
    confidence: 0.90,
  },
  {
    id: 'WORDY_PAST_HISTORY',
    pattern: /\bpast\s+history\b/gi,
    type: 'clarity',
    replacement: 'history',
    explanation: 'Redundant: history is past.',
    confidence: 0.90,
  },

  // 12. Inclusive Language
  {
    id: 'INCLUSIVE_GUYS',
    pattern: /\bhey\s+guys\b/gi,
    type: 'tone',
    replacement: 'hey everyone',
    explanation: 'Inclusive language: consider "everyone" or "team" instead of "guys".',
    confidence: 0.80,
  },
  {
    id: 'INCLUSIVE_MANKIND',
    pattern: /\bmankind\b/gi,
    type: 'tone',
    replacement: 'humanity',
    explanation: 'Inclusive alternative: "humanity" or "humankind".',
    confidence: 0.85,
  },
  {
    id: 'INCLUSIVE_MANPOWER',
    pattern: /\bmanpower\b/gi,
    type: 'tone',
    replacement: 'workforce',
    explanation: 'Inclusive alternative: "workforce" or "staff".',
    confidence: 0.85,
  },
  {
    id: 'INCLUSIVE_CRAZY',
    pattern: /\bthat'?s\s+crazy\b/gi,
    type: 'tone',
    replacement: "that's surprising",
    explanation: 'Consider more precise, less stigmatizing language than "crazy".',
    confidence: 0.70,
  },

  // 13. Commonly confused expansions
  {
    id: 'CONFUSED_WHO_WHOM',
    pattern: /\bwhom\s+is\b/gi,
    type: 'grammar',
    replacement: 'who is',
    explanation: 'Use "who" as subject ("who is"), "whom" as object.',
    confidence: 0.88,
  },
  {
    id: 'CONFUSED_COULD_OF',
    pattern: /\bcould\s+of\b/gi,
    type: 'grammar',
    replacement: 'could have',
    explanation: '"Could have", not "could of" (mishearing of "could\'ve").',
    confidence: 0.98,
  },
  {
    id: 'CONFUSED_SHOULD_OF',
    pattern: /\bshould\s+of\b/gi,
    type: 'grammar',
    replacement: 'should have',
    explanation: 'Use "should have" (or "should\'ve").',
    confidence: 0.98,
  },
  {
    id: 'CONFUSED_WOULD_OF',
    pattern: /\bwould\s+of\b/gi,
    type: 'grammar',
    replacement: 'would have',
    explanation: 'Use "would have" (or "would\'ve").',
    confidence: 0.98,
  },
  {
    id: 'CONFUSED_BETWEEN_YOU_AND_I',
    pattern: /\bbetween\s+you\s+and\s+I\b/gi,
    type: 'grammar',
    replacement: 'between you and me',
    explanation: 'Use object pronoun after preposition: "between you and me".',
    confidence: 0.94,
  },

  // 8. More Verb Forms (subject-verb + tense)
  {
    id: 'SVA_HE_WERE',
    pattern: /\b(he|she|it)\s+were\b/i,
    type: 'grammar',
    replacement: (_match, subj) => `${subj} was`,
    explanation: 'Singular subjects take "was", not "were".',
    confidence: 0.97,
  },
  {
    id: 'SVA_DOESNT_HAS',
    pattern: /\b(he|she|it)\s+doesn'?t\s+has\b/i,
    type: 'grammar',
    replacement: (_match, subj) => `${subj} doesn't have`,
    explanation: 'After "doesn\'t", use the base form "have".',
    confidence: 0.98,
  },
  {
    id: 'SVA_DONT_HAS',
    pattern: /\b(they|we|you|i)\s+don'?t\s+has\b/i,
    type: 'grammar',
    replacement: (_match, subj) => `${subj} don't have`,
    explanation: 'After "don\'t", use the base form "have".',
    confidence: 0.98,
  },
  {
    id: 'TENSE_DIDNT_PAST',
    pattern: /\bdidn'?t\s+(went|saw|ate|took|came|did|had|got|made|said|wrote|broke|chose|drove|spoke|bought|thought|knew)\b/i,
    type: 'grammar',
    replacement: (_match, past) => {
      const base: Record<string, string> = {
        went: 'go', saw: 'see', ate: 'eat', took: 'take', came: 'come', did: 'do',
        had: 'have', got: 'get', made: 'make', said: 'say', wrote: 'write',
        broke: 'break', chose: 'choose', drove: 'drive', spoke: 'speak',
        bought: 'buy', thought: 'think', knew: 'know',
      };
      return `didn't ${base[past.toLowerCase()] || past}`;
    },
    explanation: 'After "didn\'t", use the base verb form ("didn\'t go", not "didn\'t went").',
    confidence: 0.97,
  },
  {
    id: 'TENSE_HAVE_WENT',
    pattern: /\b(have|has)\s+went\b/i,
    type: 'grammar',
    replacement: (_match, aux) => `${aux} gone`,
    explanation: 'Use the past participle after "have/has": "have gone".',
    confidence: 0.97,
  },
  {
    id: 'THERE_IS_MANY',
    pattern: /\bthere\s+is\s+(many|several|few|multiple|numerous)\b/i,
    type: 'grammar',
    replacement: (_match, qty) => `there are ${qty}`,
    explanation: 'Plural quantifiers take "there are", not "there is".',
    confidence: 0.96,
  },
  {
    id: 'CONFUSED_THEIR_GOING',
    pattern: /\btheir\s+(going|coming|leaving|working)\b/i,
    type: 'grammar',
    replacement: (_match, verb) => `they're ${verb}`,
    explanation: 'Use the contraction "they\'re" (they are) before a verb.',
    confidence: 0.9,
  },

  // 9. Noun Number (plural nouns after counts/quantifiers, a + plural, much/less)
  {
    id: 'NOUN_NUM_SINGULAR',
    pattern: new RegExp(
      '\\b(two|three|four|five|six|seven|eight|nine|ten|many|several|few|multiple|numerous|both|these|those|various)\\s+(' +
        Object.keys(COUNTABLE_SINGULAR_TO_PLURAL).join('|') +
        ')\\b',
      'i'
    ),
    type: 'grammar',
    replacement: (_match, qty, noun) => `${qty} ${COUNTABLE_SINGULAR_TO_PLURAL[noun.toLowerCase()] || noun}`,
    explanation: 'Countable nouns after a number or plural quantifier must be plural.',
    confidence: 0.95,
  },
  {
    id: 'NOUN_A_PLURAL',
    pattern: new RegExp(
      '\\ba\\s+(' + Object.values(COUNTABLE_SINGULAR_TO_PLURAL).join('|') + ')\\b',
      'i'
    ),
    type: 'grammar',
    replacement: (_match, plural) => {
      const singular = PLURAL_TO_SINGULAR[plural.toLowerCase()] || plural;
      const article = /^[aeiou]/i.test(singular) ? 'an' : 'a';
      return `${article} ${singular}`;
    },
    explanation: '"A/an" takes a singular noun.',
    confidence: 0.95,
  },
  {
    id: 'NOUN_MUCH_COUNTABLE',
    pattern: /\bmuch\s+(problems|reasons|people|things|ideas|cars|members|apples|days|years|meetings|emails|students)\b/i,
    type: 'grammar',
    replacement: (_match, noun) => `many ${noun}`,
    explanation: 'Use "many" with countable nouns ("many problems", not "much problems").',
    confidence: 0.96,
  },
  {
    id: 'NOUN_LESS_COUNTABLE',
    pattern: /\bless\s+(problems|reasons|people|things|members|cars|meetings|apples|students)\b/i,
    type: 'grammar',
    replacement: (_match, noun) => `fewer ${noun}`,
    explanation: 'Use "fewer" with countable nouns ("fewer reasons", not "less reasons").',
    confidence: 0.95,
  },
];

function shouldApplyRule(rule: GrammarRule, goals: WritingGoals): boolean {
  if (rule.domains && !rule.domains.includes(goals.domain)) return false;
  if (rule.skipDomains && rule.skipDomains.includes(goals.domain)) return false;
  // Casual ignores wordiness/passive gently — reduce but don't skip fully; caller filters by confidence
  return true;
}

/**
 * Fast non-autoregressive grammar tagger (<15ms)
 */
export function checkGrammar(
  sentenceText: string,
  sentenceOffset: number,
  sentenceIndex: number,
  goals: WritingGoals = DEFAULT_GOALS
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

  // Check 2: Pattern-based rules (goals-aware)
  for (const rule of GRAMMAR_RULES) {
    if (!shouldApplyRule(rule, goals)) continue;
    // In casual/creative, dampen low-confidence clarity suggestions
    if ((goals.domain === 'casual' || goals.domain === 'creative') && rule.type === 'clarity' && rule.confidence < 0.85) continue;
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
