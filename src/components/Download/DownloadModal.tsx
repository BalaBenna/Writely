import React, { useState, useEffect } from 'react';
import { X, Download, Apple, Monitor, Terminal, Check, ExternalLink, ShieldCheck, Cpu, Loader2 } from 'lucide-react';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  const [copiedMac, setCopiedMac] = useState(false);
  const [copiedWin, setCopiedWin] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState<string | null>(null);
  const [assets, setAssets] = useState<{ name: string; url: string; size: number }[] | null>(null);
  const [assetsError, setAssetsError] = useState(false);

  useEffect(() => {
    if (!isOpen || assets !== null) return;
    fetch('https://api.github.com/repos/BalaBenna/Writely/releases/latest', { headers: { Accept: 'application/vnd.github.v3+json' } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const list = (data.assets || []).map((a: any) => ({ name: a.name, url: a.browser_download_url, size: a.size }));
        setAssets(list);
      })
      .catch(() => setAssetsError(true));
  }, [isOpen, assets]);

  const macAsset = assets?.find(a => a.name.endsWith('.dmg')) || null;
  const winAsset = assets?.find(a => a.name.endsWith('.exe') || a.name.endsWith('.msi')) || null;

  if (!isOpen) return null;

  const handleDownload = (os: 'mac' | 'win') => {
    const asset = os === 'mac' ? macAsset : winAsset;
    if (asset?.url) {
      window.open(asset.url, '_blank', 'noopener,noreferrer');
    } else {
      window.open('https://github.com/BalaBenna/Writely/releases/latest', '_blank', 'noopener,noreferrer');
    }
    setDownloadStarted(os);
    setTimeout(() => setDownloadStarted(null), 3500);
  };

  const copyBrew = () => {
    navigator.clipboard.writeText('brew install --cask writely');
    setCopiedMac(true);
    setTimeout(() => setCopiedMac(false), 2000);
  };

  const copyWinget = () => {
    navigator.clipboard.writeText('winget install Writely.Writely');
    setCopiedWin(true);
    setTimeout(() => setCopiedWin(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl glass-dropdown rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10 mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Download Writely Desktop
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Native, open-source desktop app for macOS & Windows with 100% offline AI
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Download Notice */}
        {downloadStarted && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                Preparing <strong>Writely ({downloadStarted === 'mac' ? 'macOS Universal .DMG' : 'Windows Setup .EXE'})</strong> — fetching latest release…
              </span>
            </div>
            <span className="font-mono text-[10px] bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded font-bold">
              ~12.4 MB
            </span>
          </div>
        )}

        {/* Dual Platform Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* macOS Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/30 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white">
                    <Apple className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">macOS</h3>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                      Apple Silicon (M1–M4) & Intel
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-white/5">
                  Universal .DMG
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                Hardware-accelerated via Apple Neural Engine (ANE) and Metal for 12–22ms realtime grammar fixes.
              </p>

              {/* Homebrew command */}
              <div className="bg-slate-200/60 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-300 dark:border-white/5 mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 font-mono text-[11px] text-indigo-700 dark:text-indigo-300 truncate">
                  <Terminal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span className="truncate">brew install --cask writely</span>
                </div>
                <button
                  onClick={copyBrew}
                  className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-300 dark:hover:bg-white/10 transition-colors ml-2 shrink-0"
                  title="Copy command"
                >
                  {copiedMac ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Terminal className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => handleDownload('mac')}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>{macAsset ? `Download ${macAsset.name}` : 'Download for Mac (.dmg)'}</span>
            </button>
            {assets === null && !assetsError && <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2"><Loader2 className="w-3 h-3 animate-spin" />Fetching latest release…</div>}
            {assetsError && <div className="text-[11px] text-slate-500 mt-2">Direct asset not yet published — use Releases page below.</div>}
          </div>

          {/* Windows Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 hover:border-sky-400 dark:hover:border-sky-500/30 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">Windows</h3>
                    <span className="text-[11px] text-sky-700 dark:text-sky-400 font-medium">
                      Windows 10 / 11 (64-bit)
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-white/5">
                  NSIS .EXE / .MSIX
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                Accelerated via DirectML, Vulkan, and Intel NPU. Fallback CPU SIMD covers all standard PCs.
              </p>

              {/* WinGet command */}
              <div className="bg-slate-200/60 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-300 dark:border-white/5 mb-4 flex items-center justify-between">
                <div className="flex items-center space-x-2 font-mono text-[11px] text-sky-700 dark:text-sky-300 truncate">
                  <Terminal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span className="truncate">winget install Writely.Writely</span>
                </div>
                <button
                  onClick={copyWinget}
                  className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-300 dark:hover:bg-white/10 transition-colors ml-2 shrink-0"
                  title="Copy command"
                >
                  {copiedWin ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Terminal className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => handleDownload('win')}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-semibold text-xs transition-all"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>{winAsset ? `Download ${winAsset.name}` : 'Download for Windows (.exe)'}</span>
            </button>
          </div>
        </div>

        {/* System Specs Requirements */}
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 mb-4">
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>System Requirements</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 dark:text-slate-400">
            <div>
              <span className="block text-slate-500 text-[10px]">RAM Required</span>
              <strong className="text-slate-900 dark:text-slate-200">8 GB+</strong>
            </div>
            <div>
              <span className="block text-slate-500 text-[10px]">App Size</span>
              <strong className="text-slate-900 dark:text-slate-200">~12.4 MB</strong>
            </div>
            <div>
              <span className="block text-slate-500 text-[10px]">Default Model</span>
              <strong className="text-slate-900 dark:text-slate-200">45 MB (GECToR)</strong>
            </div>
            <div>
              <span className="block text-slate-500 text-[10px]">Privacy SLA</span>
              <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">0% Cloud / Telemetry</strong>
            </div>
          </div>
        </div>

        {/* Direct release asset links (dynamic) */}
        {assets && assets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-[11px]">
            {assets.slice(0, 4).map(a => (
              <a key={a.name} href={a.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/40 bg-white dark:bg-slate-900/50">
                <span className="font-mono text-slate-700 dark:text-slate-300 truncate pr-2">{a.name}</span>
                <span className="text-slate-400 shrink-0">{(a.size / 1024 / 1024).toFixed(1)} MB</span>
              </a>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-[11px]">
            <a href="https://github.com/BalaBenna/Writely/releases/latest" target="_blank" rel="noreferrer" className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/40 bg-white dark:bg-slate-900/50">
              <span className="font-mono text-slate-700 dark:text-slate-300">Releases — latest</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            <div className="p-2 rounded-lg border border-dashed border-slate-300 dark:border-white/10 text-slate-500 dark:text-slate-400">No assets yet — tag v* to build</div>
          </div>
        )}
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">Web demo (no install): <a href="https://balabenna.github.io/Writely/" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">balabenna.github.io/Writely</a> • PWA works offline after first load.</p>

        {/* Browser Extension Note */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-white/10">
          <div className="flex items-center space-x-1.5">
            <span>Also includes Chrome / Edge Extension in <code className="font-mono text-indigo-600 dark:text-indigo-300">extensions/chrome/</code></span>
          </div>

          <a
            href="https://github.com/BalaBenna/Writely/releases"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            <span>GitHub Releases</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
