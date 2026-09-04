// Secure preload — Renderer → Preload → Main → AIManager → llama-server (per spec §21)
// Renderer never gets Node/fs/process directly.
const { contextBridge, ipcRenderer } = require('electron');
let os = null;
try { os = require('os'); } catch {}

contextBridge.exposeInMainWorld('writely', {
  platform: process.platform,
  isElectron: true,
  version: process.env.npm_package_version || '1.4.0',
  getSystemInfo: () => ipcRenderer.invoke('writely:getSystemInfo'),
  scanModels: () => ipcRenderer.invoke('writely:scanModels'),
  getModelsDir: () => ipcRenderer.invoke('writely:getModelsDir'),
  downloadModel: (modelId) => ipcRenderer.invoke('writely:downloadModel', modelId),
  deleteModel: (modelId) => ipcRenderer.invoke('writely:deleteModel', modelId),
  linkExternalModel: (modelId, externalPath) => ipcRenderer.invoke('writely:linkExternalModel', modelId, externalPath),
  onDownloadProgress: (cb) => {
    const handler = (_e, data) => cb(data);
    ipcRenderer.on('writely:download-progress', handler);
    return () => ipcRenderer.removeListener('writely:download-progress', handler);
  },
});

contextBridge.exposeInMainWorld('writelyAI', {
  correct: (req) => ipcRenderer.invoke('writely:correct', req),
  rewrite: (req) => ipcRenderer.invoke('writely:rewrite', req),
  health: () => ipcRenderer.invoke('writely:health'),
});

contextBridge.exposeInMainWorld('writelyCapture', {
  getSelectedText: () => ipcRenderer.invoke('writely:getSelectedText'),
  replaceSelectedText: (text) => ipcRenderer.invoke('writely:replaceSelectedText', text),
  getFocusedApplication: () => ipcRenderer.invoke('writely:getFocusedApplication'),
  checkAccessibility: () => ipcRenderer.invoke('writely:checkAccessibility'),
});

// System-wide pipeline bridge (global hotkey → renderer correction → overlay popup)
contextBridge.exposeInMainWorld('writelySystem', {
  // Main → renderer: correct this captured text (send back via sendSystemResult)
  onSystemCorrect: (cb) => {
    const handler = (_e, job) => cb(job);
    ipcRenderer.on('writely:system-correct', handler);
    return () => ipcRenderer.removeListener('writely:system-correct', handler);
  },
  sendSystemResult: (result) => ipcRenderer.send('writely:system-correct-done', result),
  // Main → overlay window: show correction data
  onOverlayData: (cb) => {
    const handler = (_e, data) => cb(data);
    ipcRenderer.on('writely:overlay-data', handler);
    return () => ipcRenderer.removeListener('writely:overlay-data', handler);
  },
  overlayAccept: (corrected) => ipcRenderer.invoke('writely:overlay-accept', corrected),
  overlayDismiss: () => ipcRenderer.invoke('writely:overlay-dismiss'),
  // Explicit user opt-in for system-wide fixes (default OFF)
  getSystemOptIn: () => ipcRenderer.invoke('writely:getSystemOptIn'),
  setSystemOptIn: (enabled) => ipcRenderer.invoke('writely:setSystemOptIn', enabled),
  // Overlay → Main → renderer: re-run a tab (tone) or a chat instruction
  // on the captured text. Accepts a tone string or { tone?, instruction?, base? }.
  requestRewrite: (arg) => ipcRenderer.invoke('writely:overlay-rewrite', typeof arg === 'string' ? { tone: arg } : arg),
  onSystemRewrite: (cb) => {
    const handler = (_e, req) => cb(req);
    ipcRenderer.on('writely:system-rewrite', handler);
    return () => ipcRenderer.removeListener('writely:system-rewrite', handler);
  },
  sendSystemRewriteDone: (res) => ipcRenderer.send('writely:system-rewrite-done', res),
});
