import { ToneAnalysis } from '../types';

const FORMAL_MARKERS = ['moreover', 'furthermore', 'therefore', 'however', 'consequently', 'nevertheless', 'accordingly', 'notwithstanding', 'hence', 'thus', 'whereas', 'utilize', 'obtain', 'facilitate', 'endeavor', 'commence', 'ascertain'];
const INFORMAL_MARKERS = ['gonna', 'wanna', 'kinda', 'sorta', 'yeah', 'yep', 'cool', 'awesome', 'guys', 'lol', 'btw', 'omg', 'gotta', 'lemme', 'dunno', 'cuz', 'gotta'];
const CONFIDENT_MARKERS = ['will', 'definitely', 'certainly', 'absolutely', 'clearly', 'undoubtedly', 'must', 'guaranteed'];
const HEDGING_MARKERS = ['maybe', 'perhaps', 'possibly', 'might', 'could', 'seems', 'appears', 'somewhat', 'kind of', 'sort of', 'i think', 'i believe'];
const FRIENDLY_MARKERS = ['thanks', 'thank you', 'please', 'great', 'wonderful', 'happy', 'excited', 'love', 'appreciate', 'cheers', 'hope'];

export function analyzeTone(text: string): ToneAnalysis {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return { overall: 'neutral', scores: {}, emoji: '😐', description: 'Neutral — add more text for tone analysis' };
  }

  const countMarkers = (markers: string[]) => markers.filter(m => lower.includes(m)).length;

  const formal = countMarkers(FORMAL_MARKERS);
  const informal = countMarkers(INFORMAL_MARKERS);
  const confident = countMarkers(CONFIDENT_MARKERS);
  const hedging = countMarkers(HEDGING_MARKERS);
  const friendly = countMarkers(FRIENDLY_MARKERS);
  const exclamations = (text.match(/!/g) || []).length;
  const questions = (text.match(/\?/g) || []).length;

  const scores: Record<string, number> = {
    formal: Math.min(100, formal * 18 + (words.some(w => w.length > 10) ? 10 : 0)),
    informal: Math.min(100, informal * 20 + exclamations * 10),
    confident: Math.min(100, confident * 22 - hedging * 8 + 30),
    friendly: Math.min(100, friendly * 18 + exclamations * 8),
    neutral: 50,
  };

  let overall: ToneAnalysis['overall'] = 'neutral';
  let emoji = '😐';
  let description = 'Neutral and balanced';

  const maxEntry = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const maxScore = maxEntry[1];

  if (maxScore < 25) {
    overall = 'neutral';
    emoji = '😐';
    description = 'Neutral — factual and straightforward';
  } else if (maxEntry[0] === 'formal' && formal > informal) {
    overall = 'formal';
    emoji = '🎩';
    description = 'Formal — professional and polished';
  } else if (maxEntry[0] === 'informal') {
    overall = 'informal';
    emoji = '😊';
    description = 'Informal — casual and conversational';
  } else if (maxEntry[0] === 'confident' && confident > hedging) {
    overall = 'confident';
    emoji = '💪';
    description = 'Confident — decisive and assertive';
  } else if (maxEntry[0] === 'friendly') {
    overall = 'friendly';
    emoji = '🤝';
    description = 'Friendly — warm and approachable';
  }

  if (questions > 2 && overall === 'neutral') {
    description += ' • inquisitive';
  }

  return { overall, scores, emoji, description };
}
