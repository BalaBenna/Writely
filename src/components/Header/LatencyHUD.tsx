import React, { useState } from 'react';
import { Zap, Cpu, Clock, CheckCircle2, ChevronDown } from 'lucide-react';
import { EngineTelemetry } from '../../types';

interface LatencyHUDProps {
  telemetry: EngineTelemetry;
}

export const LatencyHUD: React.FC<LatencyHUDProps> = ({ telemetry }) => {
  const [isOpen, setIsOpen] = useState(false);

  const isUltraFast = telemetry.lastLatencyMs < 50;
  const isSlaCompliant = telemetry.lastLatencyMs < 150;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
          isUltraFast
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
            : isSlaCompliant
            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
        }`}
        title="Click to view latency telemetry breakdown"
      >
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isUltraFast ? 'bg-emerald-400' : 'bg-indigo-400'
            }`}
          ></span>
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isUltraFast ? 'bg-emerald-500' : 'bg-indigo-500'
            }`}
          ></span>
        </span>
        <Zap className="w-3.5 h-3.5" />
        <span className="font-mono font-semibold">
          {telemetry.lastLatencyMs.toFixed(1)} ms
        </span>
        <span className="text-[10px] opacity-75 hidden sm:inline">
          {telemetry.cacheHit ? '(Cache Hit)' : isUltraFast ? '(<50ms Realtime)' : '(<150ms SLA)'}
        </span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 glass-dropdown rounded-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10 mb-3">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Performance Telemetry</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono">
                SLA: &lt;150ms
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Total Latency:
                </span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {telemetry.lastLatencyMs.toFixed(1)} ms
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Sentence Split & Tokenize:</span>
                <span className="font-mono text-slate-800 dark:text-slate-300">
                  {telemetry.tokenizerMs.toFixed(2)} ms
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Inference Engine Pass:</span>
                <span className="font-mono text-slate-800 dark:text-slate-300">
                  {telemetry.engineMs.toFixed(2)} ms
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Sentence Hash Cache:</span>
                <span
                  className={`font-mono px-1.5 py-0.5 rounded text-[11px] ${
                    telemetry.cacheHit
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {telemetry.cacheHit ? 'HIT (0.1ms)' : 'DIRTY RECHECK'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-white/10">
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> Active Local Model:
                </div>
                <div className="font-mono text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 p-1.5 rounded border border-indigo-200 dark:border-indigo-500/20 truncate">
                  {telemetry.activeModel}
                </div>
              </div>

              <div className="pt-1 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>100% on-device local execution</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
