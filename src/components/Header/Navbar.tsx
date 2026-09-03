import React from 'react';
import { Feather, Download, Cpu, Settings, ShieldCheck, Sun, Moon, Sparkles } from 'lucide-react';
import { EngineTelemetry } from '../../types';
import { LatencyHUD } from './LatencyHUD';

interface NavbarProps {
  telemetry: EngineTelemetry;
  onOpenDownload: () => void;
  onOpenModels: () => void;
  onOpenSettings: () => void;
  onOpenRewrite: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  telemetry,
  onOpenDownload,
  onOpenModels,
  onOpenSettings,
  onOpenRewrite,
  isDark,
  toggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-slate-200 dark:border-white/5 px-4 lg:px-8 py-3 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 shadow-glow p-0.5">
            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Feather className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                Writely
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/30">
                LOCAL AI
              </span>
            </div>

          </div>
        </div>

        {/* Center: Privacy Guarantee & Latency HUD */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-full font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Offline & Private</span>
          </div>

          <LatencyHUD telemetry={telemetry} />
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {/* Rewrite Studio Button */}
          <button
            onClick={onOpenRewrite}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
            title="Open AI Tone & Rewrite Studio"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rewrite Studio</span>
          </button>

          {/* Download App Button */}
          <button
            onClick={onOpenDownload}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 transition-colors"
            title="Download for Mac & Windows"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Download</span>
          </button>

          {/* Models Manager */}
          <button
            onClick={onOpenModels}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/5 transition-colors"
            title="Manage Local AI Models"
          >
            <Cpu className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/5 transition-colors"
            title="Engine & Editor Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/5 transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
