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
});
