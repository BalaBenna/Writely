import React, { useState } from 'react';
import {
  Feather,
  Cpu,
  BookA,
  History,
  Sparkles,
  Settings,
  Download,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  ShieldAlert,
  BookMarked,
  ScanEye,
  BarChart3,
  Palette,
  HelpCircle,
} from 'lucide-react';

export type NavScreen = 'editor' | 'models' | 'dictionary' | 'history' | 'plagiarism' | 'citations' | 'detector' | 'analytics' | 'styleguide';

interface AppSidebarProps {
  currentScreen: NavScreen;
  onSelectScreen: (screen: NavScreen) => void;
  onOpenDownload: () => void;
  onOpenSettings: () => void;
  onOpenRewrite: () => void;
  onOpenOnboarding: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentScreen,
  onSelectScreen,
  onOpenDownload,
  onOpenSettings,
  onOpenRewrite,
  onOpenOnboarding,
  isDark,
  toggleTheme,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { id: 'editor' as NavScreen, label: 'Editor', icon: Feather },
    { id: 'models' as NavScreen, label: 'AI Models', icon: Cpu, badge: 'Catalog' },
    { id: 'dictionary' as NavScreen, label: 'Dictionary', icon: BookA },
    { id: 'history' as NavScreen, label: 'History', icon: History },
    { id: 'plagiarism' as NavScreen, label: 'Plagiarism', icon: ShieldAlert },
    { id: 'citations' as NavScreen, label: 'Citations', icon: BookMarked },
    { id: 'detector' as NavScreen, label: 'AI Detector', icon: ScanEye },
    { id: 'analytics' as NavScreen, label: 'Analytics', icon: BarChart3 },
    { id: 'styleguide' as NavScreen, label: 'Style Guide', icon: Palette },
  ];

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-56'
      } shrink-0 flex flex-col p-3.5 bg-slate-50/95 dark:bg-slate-950/80 border-r border-slate-200 dark:border-white/5 select-none transition-all duration-200 ease-in-out overflow-hidden`}
    >
      {/* Top Section - scrollable */}
      <div className="flex-1 flex flex-col space-y-5 min-h-0 overflow-hidden">
        {/* Brand + Collapse Toggle */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-1 pt-1`}>
          {/* Brand Logo */}
          <div className={`flex items-center ${collapsed ? '' : 'space-x-2.5'}`}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Feather className="w-4.5 h-4.5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-white tracking-tight leading-none">
                  Writely
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Open Proofreader
                </span>
              </div>
            )}
          </div>

          {/* Collapse / Expand Button */}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/5 transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div className="flex justify-center">
            <button
              onClick={() => setCollapsed(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-white/5 transition-colors"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Primary Navigation - scrollable */}
        <nav className="space-y-1 overflow-y-auto overflow-x-hidden flex-1 min-h-0 pr-1 -mr-1 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectScreen(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <div className={`flex items-center ${collapsed ? '' : 'space-x-2.5'}`}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </div>
                {!collapsed && item.badge && !isActive && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-indigo-500/15 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Rewrite Studio Trigger */}
          <button
            onClick={onOpenRewrite}
            title={collapsed ? 'Tone Studio' : undefined}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/5 transition-colors`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
            {!collapsed && <span>Tone Studio</span>}
          </button>
        </nav>
      </div>
      {/* Bottom Actions - pinned */}
      <div className="space-y-1 pt-4 border-t border-slate-200 dark:border-white/5 shrink-0">
        <button
          onClick={onOpenSettings}
          title={collapsed ? 'Settings' : undefined}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/5 transition-colors`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>

        <button
          onClick={onOpenOnboarding}
          title={collapsed ? 'Onboarding Tour' : undefined}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/5 transition-colors`}
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Tour</span>}
        </button>

        <button
          onClick={toggleTheme}
          title={collapsed ? (isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode') : undefined}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-white/5 transition-colors`}
        >
          {isDark ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        <button
          onClick={onOpenDownload}
          title={collapsed ? 'Download App' : undefined}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-2.5'} px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-600/20 transition-colors`}
        >
          <Download className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Download App</span>}
        </button>

        {/* Offline Badge */}
        {!collapsed && (
          <div className="mt-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center space-x-2 text-[11px] font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>100% Offline</span>
          </div>
        )}

        {collapsed && (
          <div className="flex justify-center mt-2" title="100% Offline">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
