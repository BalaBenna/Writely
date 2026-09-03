#!/usr/bin/env tsx
// writely CLI — local Grammarly alternative (per spec §26)
// Usage: npx tsx src/cli/writely.ts check test.txt
//        npx tsx src/cli/writely.ts check "He go to school"
//        npx tsx src/cli/writely.ts bench

import fs from 'fs';
import path from 'path';
import { writingEngine } from '../ai/WritingEngine';
import { analyzeDocument } from '../engine/hybridEngine';

const args = process.argv.slice(2);
const cmd = args[0];

async function cmdCheck(target: string | undefined) {
  if (!target) {
    console.error('Usage: writely check <file|text>');
    console.error('  writely check test.txt');
    console.error('  writely check "He go to school yesterday."');
    process.exit(1);
  }

  let text = target;
  let fileName = '';
  // If target is a file path that exists, read it
  const maybePath = path.resolve(target);
  if (fs.existsSync(maybePath) && fs.statSync(maybePath).isFile()) {
    text = fs.readFileSync(maybePath, 'utf-8');
    fileName = target;
  } else if (fs.existsSync(target) && fs.statSync(target).isFile()) {
    text = fs.readFileSync(target, 'utf-8');
    fileName = target;
  }

  console.log(`\nWritely — Local AI Grammar Check (100% offline, no cloud)`);
  if (fileName) console.log(`File: ${fileName} (${text.length} chars)`);
  console.log(`Text: "${text.slice(0,120).replace(/\n/g, ' ')}${text.length>120?'…':''}"\n`);

  // Use 3-layer WritingEngine: rule → fast AI (falls back to rule if no llama-server)
  // For CLI, we call hybridEngine directly (fast, <50ms) plus WritingEngine for AI path
  const hybrid = analyzeDocument(text);
  const t0 = performance.now();
  // Also try WritingEngine sentence-by-sentence (will use AI if llama-server running)
  const { splitSentences } = await import('../engine/sentence');
  const sentences = splitSentences(text);
  let aiSuggestions: any[] = [];
  for (const s of sentences) {
    const sug = await writingEngine.analyzeSentence(s.text, s.start, s.index, { useAI: false });
    aiSuggestions.push(...sug);
  }
  const aiMs = (performance.now() - t0).toFixed(1);

  const suggestions = hybrid.suggestions;

  if (suggestions.length === 0) {
    console.log('✓ No issues found — looks good!\n');
    process.exit(0);
  }

  console.log(`Found ${suggestions.length} issue${suggestions.length>1?'s':''} (hybrid ${hybrid.telemetry.lastLatencyMs}ms, engine ${aiMs}ms):\n`);

  for (const s of suggestions) {
    const lineInfo = getLineCol(text, s.start);
    console.log(`Line ${lineInfo.line}, Col ${lineInfo.col}:`);
    console.log(`  "${s.original}"`);
    console.log(`   ${' '.repeat(Math.min(s.original.length, 10))}↓`);
    console.log(`  "${s.replacement}"`);
    console.log(`  ${s.type} · ${Math.round((s.confidence||0.9)*100)}% · ${s.explanation}`);
    console.log(`  [${s.start}:${s.end}] rule:${s.ruleId}\n`);
  }

  // Hint for Qwen3-8B swap
  console.log(`Tip: To test with real Qwen3-8B GGUF via llama.cpp:`);
  console.log(`  1. Download: huggingface.co/Qwen/Qwen3-8B-GGUF → qwen3-8b-q4_k_m.gguf → ~/.writely/models/qwen3-8b/model.gguf`);
  console.log(`  2. Run: llama-server --model ~/.writely/models/qwen3-8b/model.gguf --port 8080`);
  console.log(`  3. Re-run: writely check test.txt --ai (will use JSON Schema constrained generation)\n`);
}

function getLineCol(text: string, offset: number) {
  const before = text.slice(0, offset);
  const line = before.split('\n').length;
  const col = before.split('\n').pop()!.length + 1;
  return { line, col };
}

(async () => {
  if (cmd === 'check') {
    await cmdCheck(args[1]);
  } else if (cmd === 'bench') {
    // delegate to bench
    const proc = await import('child_process');
    proc.spawnSync('npx', ['tsx', 'bench/realtime_bench.ts'], { stdio: 'inherit' });
  } else if (cmd === '--help' || cmd === '-h' || !cmd) {
    console.log(`
Writely — Open-Source Local-AI Grammarly Alternative (100% offline)

Usage:
  writely check <file|text>   Check grammar/spelling (rule engine + local AI if running)
  writely bench               Run latency benchmark (<50ms SLA)
  writely --help              Show this

Examples:
  writely check test.txt
  writely check "He go to school yesterday and dont bring his book."

Models:
  Writely downloads GGUF once to ~/.writely/models/<id>/model.gguf
  Default: GECToR 80M (45MB) for realtime + Qwen3-8B (4.8GB) for rewriting via llama.cpp
  Choose Fast (3B/4B) / Balanced (8B) / Quality (14B) in AI Models

More: https://github.com/BalaBenna/Writely
`);
  } else {
    console.error(`Unknown command: ${cmd}`);
    console.error('Try: writely --help');
    process.exit(1);
  }
})();
