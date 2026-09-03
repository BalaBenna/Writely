// Secure preload — expose minimal API for future local model bridge + system info
const { contextBridge } = require('electron');
let os = null;
try { os = require('os'); } catch {}

contextBridge.exposeInMainWorld('writely', {
  platform: process.platform,
  isElectron: true,
  version: process.env.npm_package_version || '1.3.0',
  getSystemInfo: async () => {
    try {
      if (!os) return null;
      const totalMem = os.totalmem(); // bytes
      const freeMem = os.freemem();
      const cpus = os.cpus();
      return {
        ramGB: +(totalMem / 1024 / 1024 / 1024).toFixed(1),
        freeMemGB: +(freeMem / 1024 / 1024 / 1024).toFixed(1),
        cpuCores: cpus?.length || null,
        cpuModel: cpus?.[0]?.model || null,
        platform: process.platform,
      };
    } catch { return null; }
  },
});
