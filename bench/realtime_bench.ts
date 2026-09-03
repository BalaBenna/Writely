import { analyzeDocument } from '../src/engine/hybridEngine';
import { globalSentenceCache } from '../src/engine/cache';

interface BenchCase {
  name: string;
  text: string;
  expectedMinSuggestions: number;
}

const TEST_CASES: BenchCase[] = [
  {
    name: 'Subject-Verb Agreement ("he go")',
    text: 'He go to the store every single morning.',
    expectedMinSuggestions: 1,
  },
  {
    name: 'Irregular Past Tense ("did went")',
    text: 'We did went to the museum yesterday.',
    expectedMinSuggestions: 1,
  },
  {
    name: 'Commonly Confused Words ("their are")',
    text: 'Their are multiple factors that affect the result.',
    expectedMinSuggestions: 1,
  },
  {
    name: 'Contraction Apostrophe ("its a")',
    text: 'Its a very important document.',
    expectedMinSuggestions: 1,
  },
  {
    name: 'Conciseness & Wordiness ("in order to")',
    text: 'In order to complete the project, we must collaborate closely.',
    expectedMinSuggestions: 1,
  },
  {
    name: 'Full Multi-Sentence Document (Grammar + Spelling + Style)',
    text: 'He go to the store yesterday . Their are many reasons why this is bad , due to the fact that he don\'t have no money . We is hoping that you can fix this asap .',
    expectedMinSuggestions: 4,
  },
  {
    name: 'Double Negative ("don\'t have no")',
    text: "He don't have no money.",
    expectedMinSuggestions: 1,
  },
  {
    name: 'Article a/an ("a apple")',
    text: 'It is a apple and an university project.',
    expectedMinSuggestions: 1,
  },
  {
    name: 'Tense ("has went")',
    text: 'She has went to the store.',
    expectedMinSuggestions: 1,
  },
  {
    name: 'Could of → could have',
    text: 'You could of done better.',
    expectedMinSuggestions: 1,
  },
];

async function runBenchmark() {
  console.log('===============================================================');
  console.log('       WRITELY REALTIME LATENCY & ACCURACY BENCHMARK           ');
  console.log('          Goal: <50ms Realtime | SLA Budget: <150ms            ');
  console.log('===============================================================\n');

  globalSentenceCache.clear();
  let allPassed = true;

  console.log('--- Phase 1: Cold Pass Latency Benchmark (No Cache) ---');
  for (const tc of TEST_CASES) {
    const t0 = performance.now();
    const result = analyzeDocument(tc.text);
    const duration = performance.now() - t0;

    const latencyPass = duration < 150.0;
    const accuracyPass = result.suggestions.length >= tc.expectedMinSuggestions;

    const status = latencyPass && accuracyPass ? '✅ PASS' : '❌ FAIL';
    if (!latencyPass || !accuracyPass) allPassed = false;

    console.log(
      `${status} | ${tc.name.padEnd(45)} | ${duration.toFixed(2).padStart(6)} ms | Found: ${result.suggestions.length} issues`
    );
  }

  console.log('\n--- Phase 2: Hot Cache Latency Benchmark (Retyping) ---');
  for (const tc of TEST_CASES) {
    const t0 = performance.now();
    const result = analyzeDocument(tc.text);
    const duration = performance.now() - t0;

    const cachePass = duration < 2.0; // Must be <2ms
    const status = cachePass ? '⚡ ULTRA-FAST' : '⚠️ SLOW';
    if (!cachePass) allPassed = false;

    console.log(
      `${status} | ${tc.name.padEnd(45)} | ${duration.toFixed(2).padStart(6)} ms | (Cache Hit)`
    );
  }

  console.log('\n--- Phase 3: High-Frequency Typing Stress Test (50 Keystrokes) ---');
  const baseText = 'He go to school . ';
  const timings: number[] = [];

  for (let i = 0; i < 50; i++) {
    const doc = baseText + `Typing letter ${i}...`;
    const t0 = performance.now();
    analyzeDocument(doc);
    timings.push(performance.now() - t0);
  }

  const avgTiming = timings.reduce((a, b) => a + b, 0) / timings.length;
  const maxTiming = Math.max(...timings);
  const minTiming = Math.min(...timings);

  console.log(`Min Latency: ${minTiming.toFixed(2)} ms`);
  console.log(`Avg Latency: ${avgTiming.toFixed(2)} ms`);
  console.log(`Max Latency: ${maxTiming.toFixed(2)} ms`);

  const slaPassed = avgTiming < 50 && maxTiming < 150;
  console.log(`\nLatency SLA Verdict: ${slaPassed ? '✅ PASSED (<50ms avg, <150ms max)' : '❌ FAILED'}`);

  console.log('\n===============================================================');
  if (allPassed && slaPassed) {
    console.log('  🎉 ALL BENCHMARKS PASSED! Engine ready for production deployment. ');
    process.exit(0);
  } else {
    console.error('  ❌ Benchmark failed to meet SLA requirements.');
    process.exit(1);
  }
}

runBenchmark();
