import { Suggestion } from '../types';

/**
 * Common misspelling lookup dictionary for O(1) instant correction (<0.1ms)
 */
const COMMON_TYPOS: Record<string, string> = {
  'teh': 'the',
  'recieve': 'receive',
  'recieved': 'received',
  'recieving': 'receiving',
  'seperate': 'separate',
  'seperated': 'separated',
  'definately': 'definitely',
  'definitly': 'definitely',
  'goverment': 'government',
  'occured': 'occurred',
  'occuring': 'occurring',
  'untill': 'until',
  'wierd': 'weird',
  'beleive': 'believe',
  'beleived': 'believed',
  'accomodate': 'accommodate',
  'accomodation': 'accommodation',
  'embarass': 'embarrass',
  'embarassed': 'embarrassed',
  'truely': 'truly',
  'wich': 'which',
  'thier': 'their',
  'tommorow': 'tomorrow',
  'tommorrow': 'tomorrow',
  'neccessary': 'necessary',
  'necesary': 'necessary',
  'calender': 'calendar',
  'guarentee': 'guarantee',
  'garantee': 'guarantee',
  'enviroment': 'environment',
  'begining': 'beginning',
  'accross': 'across',
  'allready': 'already',
  'arguement': 'argument',
  'basicly': 'basically',
  'completly': 'completely',
  'curiousity': 'curiosity',
  'dissapear': 'disappear',
  'dissapoint': 'disappoint',
  'fourty': 'forty',
  'freind': 'friend',
  'greatful': 'grateful',
  'happend': 'happened',
  'interupt': 'interrupt',
  'knowlege': 'knowledge',
  'mispell': 'misspell',
  'noticable': 'noticeable',
  'peice': 'piece',
  'posession': 'possession',
  'privilege': 'privilege',
  'privelege': 'privilege',
  'recommand': 'recommend',
  'refered': 'referred',
  'religous': 'religious',
  'rember': 'remember',
  'suprise': 'surprise',
  'tendancy': 'tendency',
  'usefull': 'useful',
  'whith': 'with',
  'writen': 'written',
  'writting': 'writing',
};

// Fast English Lexicon for vocabulary checks
const BASE_DICTIONARY = new Set([
  'a', 'about', 'above', 'across', 'act', 'active', 'activity', 'add', 'afraid', 'after', 'again', 'against',
  'age', 'ago', 'agree', 'air', 'all', 'allow', 'almost', 'alone', 'along', 'already', 'also', 'although',
  'always', 'am', 'among', 'amount', 'an', 'and', 'anger', 'angle', 'angry', 'animal', 'annual', 'another',
  'answer', 'any', 'anyone', 'anything', 'appear', 'apple', 'application', 'apply', 'approach', 'area',
  'argue', 'arm', 'around', 'arrive', 'art', 'article', 'artist', 'as', 'ask', 'assume', 'at', 'attack',
  'attend', 'attention', 'author', 'authority', 'available', 'avoid', 'away', 'baby', 'back', 'bad', 'bag',
  'balance', 'ball', 'bank', 'bar', 'base', 'basic', 'basis', 'be', 'bear', 'beat', 'beautiful', 'because',
  'become', 'bed', 'before', 'begin', 'behind', 'believe', 'benefit', 'best', 'better', 'between', 'beyond',
  'big', 'bill', 'billion', 'bit', 'black', 'blood', 'blue', 'board', 'body', 'book', 'born', 'both',
  'bother', 'bottle', 'bottom', 'box', 'boy', 'break', 'brief', 'bright', 'bring', 'broad', 'brother',
  'budget', 'build', 'building', 'burn', 'business', 'busy', 'but', 'buy', 'by', 'call', 'camera', 'campaign',
  'can', 'cancer', 'candidate', 'capital', 'car', 'card', 'care', 'career', 'carry', 'case', 'catch',
  'cause', 'cell', 'center', 'central', 'century', 'certain', 'certainly', 'chair', 'challenge', 'chance',
  'change', 'character', 'charge', 'check', 'child', 'choice', 'choose', 'church', 'citizen', 'city',
  'civil', 'claim', 'class', 'clear', 'clearly', 'close', 'coach', 'cold', 'collection', 'college', 'color',
  'come', 'commercial', 'common', 'community', 'company', 'compare', 'computer', 'concern', 'condition',
  'conference', 'congress', 'consider', 'contain', 'continue', 'control', 'cost', 'could', 'country',
  'couple', 'course', 'court', 'cover', 'create', 'crime', 'cultural', 'culture', 'cup', 'current',
  'customer', 'cut', 'dark', 'data', 'daughter', 'day', 'dead', 'deal', 'death', 'debate', 'decade',
  'decide', 'decision', 'deep', 'defense', 'degree', 'democrat', 'democratic', 'describe', 'design',
  'despite', 'detail', 'determine', 'develop', 'development', 'die', 'difference', 'different', 'difficult',
  'dinner', 'direction', 'director', 'discover', 'discuss', 'disease', 'do', 'doctor', 'dog', 'door',
  'down', 'draw', 'dream', 'drive', 'drop', 'drug', 'during', 'each', 'early', 'east', 'easy', 'eat',
  'economic', 'economy', 'edge', 'education', 'effect', 'effort', 'eight', 'either', 'election', 'else',
  'employee', 'end', 'energy', 'enjoy', 'enough', 'enter', 'entire', 'environment', 'environmental',
  'especially', 'establish', 'even', 'evening', 'event', 'ever', 'every', 'everybody', 'everyone',
  'everything', 'evidence', 'exactly', 'example', 'executive', 'exist', 'expect', 'experience', 'expert',
  'explain', 'eye', 'face', 'fact', 'factor', 'fail', 'fall', 'family', 'far', 'fast', 'father', 'fear',
  'federal', 'feel', 'feeling', 'few', 'field', 'fight', 'figure', 'fill', 'film', 'final', 'finally',
  'financial', 'find', 'fine', 'finger', 'finish', 'fire', 'firm', 'first', 'fish', 'five', 'floor',
  'fly', 'focus', 'follow', 'food', 'foot', 'for', 'force', 'foreign', 'forget', 'form', 'former',
  'forward', 'four', 'free', 'friend', 'from', 'front', 'full', 'fund', 'future', 'game', 'garden',
  'gas', 'general', 'generation', 'get', 'girl', 'give', 'glass', 'go', 'goes', 'went', 'gone', 'goal',
  'good', 'government', 'great', 'green', 'ground', 'group', 'grow', 'growth', 'guess', 'gun', 'guy',
  'hair', 'half', 'hand', 'hang', 'happen', 'happy', 'hard', 'have', 'has', 'had', 'he', 'head', 'health',
  'hear', 'heart', 'heat', 'heavy', 'help', 'her', 'here', 'herself', 'high', 'him', 'himself', 'his',
  'history', 'hit', 'hold', 'home', 'hope', 'hospital', 'hot', 'hotel', 'hour', 'house', 'how', 'however',
  'huge', 'human', 'hundred', 'husband', 'i', 'idea', 'identify', 'if', 'image', 'imagine', 'impact',
  'important', 'improve', 'in', 'include', 'including', 'increase', 'indeed', 'indicate', 'individual',
  'industry', 'information', 'inside', 'instead', 'institution', 'interest', 'interesting', 'international',
  'interview', 'into', 'investment', 'involve', 'issue', 'it', 'item', 'its', 'itself', 'job', 'join',
  'just', 'keep', 'key', 'kid', 'kill', 'kind', 'kitchen', 'know', 'knowledge', 'land', 'language',
  'large', 'last', 'late', 'later', 'laugh', 'law', 'lawyer', 'lay', 'lead', 'leader', 'learn', 'least',
  'leave', 'left', 'leg', 'legal', 'less', 'let', 'letter', 'level', 'lie', 'life', 'light', 'like',
  'likely', 'line', 'list', 'listen', 'little', 'live', 'local', 'long', 'look', 'lose', 'loss', 'lot',
  'love', 'low', 'machine', 'magazine', 'main', 'maintain', 'major', 'majority', 'make', 'man', 'manage',
  'management', 'manager', 'many', 'market', 'marriage', 'material', 'matter', 'may', 'maybe', 'me',
  'mean', 'measure', 'media', 'medical', 'meet', 'meeting', 'member', 'memory', 'mention', 'message',
  'method', 'middle', 'might', 'military', 'million', 'mind', 'minute', 'miss', 'mission', 'model',
  'modern', 'moment', 'money', 'month', 'more', 'morning', 'most', 'mother', 'mouth', 'move', 'movement',
  'movie', 'mr', 'mrs', 'much', 'music', 'must', 'my', 'myself', 'name', 'nation', 'national', 'natural',
  'nature', 'near', 'nearly', 'necessary', 'need', 'network', 'never', 'new', 'news', 'newspaper',
  'next', 'nice', 'night', 'no', 'none', 'nor', 'north', 'not', 'note', 'nothing', 'notice', 'now',
  'number', 'occur', 'of', 'off', 'offer', 'office', 'officer', 'official', 'often', 'oh', 'oil', 'ok',
  'old', 'on', 'once', 'one', 'only', 'onto', 'open', 'operation', 'opportunity', 'option', 'or', 'order',
  'organization', 'other', 'others', 'our', 'out', 'outside', 'over', 'own', 'owner', 'page', 'pain',
  'painting', 'paper', 'parent', 'part', 'participant', 'particular', 'particularly', 'partner', 'party',
  'pass', 'past', 'patient', 'pattern', 'pay', 'peace', 'people', 'per', 'perform', 'performance',
  'perhaps', 'period', 'person', 'personal', 'phone', 'physical', 'pick', 'picture', 'piece', 'place',
  'plan', 'plant', 'play', 'player', 'PM', 'point', 'police', 'policy', 'political', 'politics', 'poor',
  'popular', 'population', 'position', 'positive', 'possible', 'power', 'practice', 'prepare', 'present',
  'president', 'pressure', 'pretty', 'prevent', 'price', 'private', 'probably', 'problem', 'process',
  'produce', 'product', 'production', 'professional', 'professor', 'program', 'project', 'property',
  'protect', 'prove', 'provide', 'public', 'pull', 'purpose', 'push', 'put', 'quality', 'question',
  'quickly', 'quite', 'race', 'radio', 'raise', 'range', 'rate', 'rather', 'reach', 'read', 'ready',
  'real', 'reality', 'realize', 'really', 'reason', 'receive', 'recent', 'recently', 'recognize', 'record',
  'red', 'reduce', 'reflect', 'region', 'relate', 'relationship', 'religious', 'remain', 'remember',
  'remove', 'report', 'represent', 'republican', 'require', 'research', 'resource', 'respond', 'response',
  'responsibility', 'rest', 'result', 'return', 'reveal', 'rich', 'right', 'rise', 'risk', 'road', 'rock',
  'role', 'room', 'rule', 'run', 'safe', 'same', 'save', 'say', 'scene', 'school', 'science', 'scientist',
  'score', 'sea', 'season', 'seat', 'second', 'section', 'security', 'see', 'seek', 'seem', 'sell', 'send',
  'senior', 'sense', 'series', 'serious', 'serve', 'service', 'set', 'seven', 'several', 'sex', 'sexual',
  'shake', 'share', 'she', 'shoot', 'short', 'shot', 'should', 'shoulder', 'show', 'side', 'sign',
  'significant', 'similar', 'simple', 'simply', 'since', 'sing', 'single', 'sister', 'sit', 'site',
  'situation', 'six', 'size', 'skill', 'skin', 'small', 'smile', 'so', 'social', 'society', 'soldier',
  'some', 'somebody', 'someone', 'something', 'sometimes', 'son', 'song', 'soon', 'sort', 'sound',
  'source', 'south', 'southern', 'space', 'speak', 'special', 'specific', 'speech', 'spend', 'sport',
  'spring', 'staff', 'stage', 'stand', 'standard', 'star', 'start', 'state', 'statement', 'station',
  'stay', 'step', 'still', 'stock', 'stop', 'store', 'story', 'strategy', 'street', 'strong', 'structure',
  'student', 'study', 'stuff', 'style', 'subject', 'success', 'successful', 'such', 'suddenly', 'suffer',
  'suggest', 'summer', 'support', 'sure', 'surface', 'system', 'table', 'take', 'talk', 'task', 'tax',
  'teach', 'teacher', 'team', 'technology', 'television', 'tell', 'ten', 'tend', 'term', 'test', 'than',
  'thank', 'that', 'the', 'their', 'them', 'themselves', 'then', 'theory', 'there', 'these', 'they',
  'thing', 'think', 'third', 'this', 'those', 'though', 'thought', 'thousand', 'threat', 'three',
  'through', 'throughout', 'throw', 'thus', 'time', 'to', 'today', 'together', 'tonight', 'too', 'top',
  'total', 'tough', 'toward', 'town', 'trade', 'traditional', 'training', 'travel', 'treat', 'treatment',
  'tree', 'trial', 'trip', 'trouble', 'true', 'truth', 'try', 'turn', 'TV', 'two', 'type', 'under',
  'understand', 'unit', 'until', 'up', 'upon', 'us', 'use', 'usually', 'value', 'various', 'very', 'victim',
  'view', 'violence', 'visit', 'voice', 'vote', 'wait', 'walk', 'wall', 'want', 'war', 'watch', 'water',
  'way', 'we', 'weapon', 'wear', 'week', 'weight', 'well', 'west', 'western', 'what', 'whatever', 'when',
  'where', 'whether', 'which', 'while', 'white', 'who', 'whole', 'whom', 'whose', 'why', 'wide', 'wife',
  'will', 'win', 'wind', 'window', 'wish', 'with', 'within', 'without', 'woman', 'wonder', 'word', 'work',
  'worker', 'world', 'worry', 'would', 'write', 'writer', 'wrong', 'yard', 'yeah', 'year', 'yes', 'yet',
  'you', 'young', 'your', 'yourself'
]);

// User dictionary cache (saved in localStorage if available)
const userDictionary = new Set<string>();

export function addToUserDictionary(word: string) {
  userDictionary.add(word.toLowerCase());
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('writely_user_dict') || '[]');
      stored.push(word.toLowerCase());
      localStorage.setItem('writely_user_dict', JSON.stringify([...new Set(stored)]));
    }
  } catch (_) {
    // Ignore in non-browser environments
  }
}

export function loadUserDictionary() {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('writely_user_dict') || '[]');
      stored.forEach((w: string) => userDictionary.add(w.toLowerCase()));
    }
  } catch (_) {
    // Ignore in non-browser environments
  }
}

// Levenshtein distance for 1-2 edits
function editDistance(s1: string, s2: string): number {
  if (Math.abs(s1.length - s2.length) > 2) return 99;
  const track = Array(s2.length + 1).fill(null).map(() =>
    Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }
  return track[s2.length][s1.length];
}

/**
 * High-speed spellchecker checking word-by-word (<2ms)
 */
export function checkSpelling(
  sentenceText: string,
  sentenceOffset: number,
  sentenceIndex: number
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const wordRegex = /\b[A-Za-z]+(?:'[A-Za-z]+)?\b/g;
  let match: RegExpExecArray | null;

  while ((match = wordRegex.exec(sentenceText)) !== null) {
    const originalWord = match[0];
    const lowerWord = originalWord.toLowerCase();
    const wordStart = sentenceOffset + match.index;
    const wordEnd = wordStart + originalWord.length;

    // Check user dictionary
    if (userDictionary.has(lowerWord)) continue;

    // Check common typo direct lookup (Instant O(1))
    if (COMMON_TYPOS[lowerWord]) {
      let replacement = COMMON_TYPOS[lowerWord];
      if (originalWord[0] === originalWord[0].toUpperCase()) {
        replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      suggestions.push({
        id: `spell-${wordStart}-${wordEnd}`,
        type: 'spelling',
        original: originalWord,
        replacement,
        explanation: `Possible spelling mistake. Did you mean "${replacement}"?`,
        start: wordStart,
        end: wordEnd,
        sentenceIndex,
        ruleId: 'SPELL_COMMON_TYPO',
        confidence: 0.98,
      });
      continue;
    }

    // Skip short words or known dictionary words
    if (lowerWord.length <= 2 || BASE_DICTIONARY.has(lowerWord)) continue;

    // Skip capitalized words in the middle of sentences (proper nouns)
    if (match.index > 0 && originalWord[0] === originalWord[0].toUpperCase()) continue;

    // Edit distance check against candidate close words
    let bestCandidate = '';
    let minDistance = 3;

    for (const dictWord of BASE_DICTIONARY) {
      if (Math.abs(dictWord.length - lowerWord.length) <= 1 && dictWord[0] === lowerWord[0]) {
        const d = editDistance(lowerWord, dictWord);
        if (d < minDistance && d <= 1) {
          minDistance = d;
          bestCandidate = dictWord;
          break;
        }
      }
    }

    if (bestCandidate && minDistance <= 1) {
      let replacement = bestCandidate;
      if (originalWord[0] === originalWord[0].toUpperCase()) {
        replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      suggestions.push({
        id: `spell-${wordStart}-${wordEnd}`,
        type: 'spelling',
        original: originalWord,
        replacement,
        explanation: `Spelling error: Consider replacing "${originalWord}" with "${replacement}".`,
        start: wordStart,
        end: wordEnd,
        sentenceIndex,
        ruleId: 'SPELL_LEVENSHTEIN',
        confidence: 0.90,
      });
    }
  }

  return suggestions;
}
