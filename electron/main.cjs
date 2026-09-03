const { app, BrowserWindow, shell, Tray, Menu, nativeImage, ipcMain, utilityProcess } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const os = require('os');

let mainWindow = null;
let tray = null;
let llamaProcesses = new Map(); // modelId -> ChildProcess

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Model registry — mirrors src/engine/localModel but for Main process (spawn)
// In production, downloadUrl points to HF GGUF, stored in app.getPath('userData')/models/<id>/model.gguf
function getModelsDir() {
  return path.join(app.getPath('userData'), 'models');
}
function getModelPath(modelId) {
  return path.join(getModelsDir(), modelId, 'model.gguf');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 900,
    minHeight: 600,
    title: 'Writely',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    icon: path.join(__dirname, '../src-tauri/icons/icon.png'),
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

function createTray() {
  try {
    const iconPath = path.join(__dirname, '../src-tauri/icons/32x32.png');
    const img = nativeImage.createFromPath(iconPath);
    tray = new Tray(img.resize({ width: 16, height: 16 }));
    const menu = Menu.buildFromTemplate([
      { label: 'Show Writely', click: () => mainWindow ? mainWindow.show() : createWindow() },
      { type: 'separator' },
      { label: 'Quit', click: () => { for (const p of llamaProcesses.values()) try { p.kill(); } catch {} app.quit(); } },
    ]);
    tray.setToolTip('Writely — Local AI Assistant (Electron + llama.cpp)');
    tray.setContextMenu(menu);
    tray.on('double-click', () => mainWindow && mainWindow.show());
  } catch (_) {
    // tray optional on Linux/headless
  }
}

// --- llama.cpp sidecar management (per spec §7) ---
function spawnLlamaServer(modelId, port) {
  const modelPath = getModelPath(modelId);
  if (!fs.existsSync(modelPath)) {
    console.warn(`[llama] model not found: ${modelPath} — download first via Model Manager`);
    return null;
  }
  // Resolve llama-server binary: packaged via extraResources or dev via PATH
  const binary = process.platform === 'win32' ? 'llama-server.exe' : 'llama-server';
  const binPath = isDev ? binary : path.join(process.resourcesPath, 'llama', binary);
  const args = ['--model', modelPath, '--port', String(port), '--ctx-size', '2048', '--threads', String(Math.max(2, os.cpus().length - 1))];
  // GPU backends: Metal on mac, Vulkan on Win (per spec §7, build.md)
  if (process.platform === 'darwin') args.push('--metal');
  // Windows Vulkan is compiled in if available; else fallback CPU
  console.log(`[llama] spawning ${modelId} on :${port} → ${binPath} ${args.join(' ')}`);
  const proc = spawn(binPath, args, { stdio: 'pipe' });
  proc.stdout.on('data', d => console.log(`[llama:${modelId}] ${d}`));
  proc.stderr.on('data', d => console.log(`[llama:${modelId}] ${d}`));
  proc.on('exit', (code) => {
    console.log(`[llama:${modelId}] exited ${code} — will restart on next request`);
    llamaProcesses.delete(modelId);
  });
  llamaProcesses.set(modelId, proc);
  return proc;
}

// IPC: renderer never gets Node/fs directly — via preload → ipcMain → AIManager → llama-server
function setupAIHandlers() {
  // Health check for renderer
  ipcMain.handle('writely:health', async () => {
    const models = [];
    for (const [id, proc] of llamaProcesses) {
      models.push({ id, running: !proc.killed, pid: proc.pid });
    }
    return { ok: true, models };
  });
  ipcMain.handle('writely:getSystemInfo', async () => {
    return {
      ramGB: +(os.totalmem() / 1024 / 1024 / 1024).toFixed(1),
      freeMemGB: +(os.freemem() / 1024 / 1024 / 1024).toFixed(1),
      cpuCores: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || null,
      platform: process.platform,
    };
  });
  // AI IPC — renderer never gets Node directly (spec §21)
  // For MVP, these delegate to AIManager in renderer if llama-server not running; Main will host AIManager in Phase 2
  ipcMain.handle('writely:correct', async (_e, req) => {
    // TODO: route to AIManager.correctGrammar → InferenceEngine → llama-server /health + /completion with JSON Schema
    // For now, return empty — renderer falls back to rule engine in src/engine/hybridEngine.ts
    console.log('[ai] correct stub:', req?.text?.slice(0, 60));
    return [];
  });
  ipcMain.handle('writely:rewrite', async (_e, req) => {
    console.log('[ai] rewrite stub:', req?.style, req?.text?.slice(0, 60));
    return req?.text || '';
  });
  ipcMain.handle('writely:getFocusedApplication', async () => null);
  // Native text capture stubs — platform-specific implementations live in native/macos/*.mm and native/windows/*.cpp
  // For MVP, these return selected text via clipboard fallback; full AX/UIA comes in Phase 3 (spec §10-11)
  ipcMain.handle('writely:getSelectedText', async () => {
    // TODO: replace with native/windows/text_capture.cpp (UI Automation) and native/macos/text_capture.mm (AXUIElement)
    // For now, renderer handles capture via contenteditable/selection in web context
    return '';
  });
  ipcMain.handle('writely:replaceSelectedText', async (_e, text) => {
    // TODO: native replace via AXUIElement / UI Automation per spec §10
    console.log('[capture] replaceSelectedText stub:', text.slice(0, 80));
  });
}

app.whenReady().then(() => {
  setupAIHandlers();
  createWindow();
  createTray();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('before-quit', () => {
  for (const p of llamaProcesses.values()) try { p.kill(); } catch {}
});
