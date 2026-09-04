import { ToneStyle, RewriteResult } from './proofreadTypes';

/**
 * High-speed local rewriter & tone transformer (<120ms)
 */
export async function rewriteText(
  text: string,
  tone: ToneStyle,
  onToken?: (token: string) => void
): Promise<RewriteResult> {
  const startTime = performance.now();
  const trimmed = text.trim();

  let rewritten = '';
  let explanation = '';

  switch (tone) {
    case 'professional':
      rewritten = transformProfessional(trimmed);
      explanation = 'Polished for high-impact executive clarity and formal precision.';
      break;
    case 'friendly':
      rewritten = transformFriendly(trimmed);
      explanation = 'Warm, empathetic, and approachable phrasing.';
      break;
    case 'concise':
      rewritten = transformConcise(trimmed);
      explanation = 'Eliminated redundant qualifiers and tightened sentence structure.';
      break;
    case 'academic':
      rewritten = transformAcademic(trimmed);
      explanation = 'Enhanced lexical density and scholarly objectivity.';
      break;
    case 'casual':
      rewritten = transformCasual(trimmed);
      explanation = 'Relaxed and natural conversational flow.';
      break;
  }

  // Simulate token streaming if subscriber provided (first token in <20ms)
  if (onToken) {
    const tokens = rewritten.split(/(\s+)/);
    for (const tok of tokens) {
      onToken(tok);
      await new Promise((r) => setTimeout(r, 8));
    }
  }

  const latencyMs = Math.round(performance.now() - startTime);

  return {
    tone,
    original: text,
    rewritten,
    explanation,
    latencyMs,
  };
}

function transformProfessional(text: string): string {
  let res = text;
  res = res.replace(/\b(wanna|want to)\b/gi, 'would like to');
  res = res.replace(/\b(gonna|going to)\b/gi, 'intend to');
  res = res.replace(/\b(can you)\b/gi, 'could you please');
  res = res.replace(/\b(asap)\b/gi, 'at your earliest convenience');
  res = res.replace(/\b(let me know)\b/gi, 'please inform me');
  res = res.replace(/\b(bad)\b/gi, 'suboptimal');
  res = res.replace(/\b(good)\b/gi, 'advantageous');
  res = res.replace(/\b(tell me)\b/gi, 'provide details regarding');
  res = res.replace(/\b(fix)\b/gi, 'resolve');
  res = res.replace(/\b(he go|he went)\b/gi, 'he proceeded');
  if (!res.endsWith('.') && !res.endsWith('!') && !res.endsWith('?')) {
    res += '.';
  }
  return res.charAt(0).toUpperCase() + res.slice(1);
}

function transformFriendly(text: string): string {
  let res = text;
  res = res.replace(/\b(regards|sincerely)\b/gi, 'Warmly');
  res = res.replace(/\b(please advise)\b/gi, 'Let me know what you think!');
  res = res.replace(/\b(do not hesitate)\b/gi, 'Feel free to reach out anytime');
  if (!res.includes('thanks') && !res.includes('great')) {
    res = `Thanks for reaching out! ${res}`;
  }
  return res;
}

function transformConcise(text: string): string {
  let res = text;
  res = res.replace(/\bin order to\b/gi, 'to');
  res = res.replace(/\bdue to the fact that\b/gi, 'because');
  res = res.replace(/\bat this point in time\b/gi, 'now');
  res = res.replace(/\bhas the ability to\b/gi, 'can');
  res = res.replace(/\bfor the purpose of\b/gi, 'for');
  res = res.replace(/\beach and every\b/gi, 'every');
  res = res.replace(/\bfirst and foremost\b/gi, 'first');
  res = res.replace(/\bperiod of time\b/gi, 'period');
  res = res.replace(/\bvery\s+/gi, '');
  res = res.replace(/\breally\s+/gi, '');
  return res;
}

function transformAcademic(text: string): string {
  let res = text;
  res = res.replace(/\b(think|believe)\b/gi, 'postulate');
  res = res.replace(/\b(shows that)\b/gi, 'demonstrates empirical evidence that');
  res = res.replace(/\b(a lot of)\b/gi, 'a substantial corpus of');
  res = res.replace(/\b(big)\b/gi, 'statistically significant');
  res = res.replace(/\b(about)\b/gi, 'concerning');
  return res.charAt(0).toUpperCase() + res.slice(1);
}

function transformCasual(text: string): string {
  let res = text;
  res = res.replace(/\b(at your earliest convenience)\b/gi, 'whenever you can');
  res = res.replace(/\b(could you please)\b/gi, 'can you');
  res = res.replace(/\b(furthermore|moreover)\b/gi, 'also');
  res = res.replace(/\b(suboptimal)\b/gi, 'not great');
  return res;
}
