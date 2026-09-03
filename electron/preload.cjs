// Secure preload — expose minimal API for future local model bridge
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('writely', {
  platform: process.platform,
  isElectron: true,
  version: process.env.npm_package_version || '1.2.0',
});
