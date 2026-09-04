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

// Known model aliases for pre-existing detection (HF cache names, Ollama names)
const EXTERNAL_ALIASES_MAIN = {
  'qwen3-4b': ['qwen3-4b', 'qwen2.5-3b', 'qwen-4b', 'qwen3:4b'],
  'qwen3-8b': ['qwen3-8b', 'qwen2.5-7b', 'qwen3:8b', 'qwen2.5:7b', 'qwen3-7b'],
  'qwen3-14b': ['qwen3-14b', 'qwen2.5-14b', 'qwen3:14b'],
  'mistral-3-3b': ['mistral-3b', 'mistral:3b', 'mistral-nemo'],
  'mistral-3-8b': ['mistral-8b', 'mistral:7b', 'mistral-7b'],
  'mistral-3-14b': ['mistral-14b', 'mixtral'],
};

function scanModelsOnDisk() {
  // Returns detection results for all known Writely model ids
  const allIds = ['writely-gector-80M-int8','qwen3-4b','mistral-3-3b','qwen3-8b','mistral-3-8b','writely-qwen-0.5B-q4','qwen3-14b','mistral-3-14b','apple-speech-writing','llama-32-1b-writing','writely-qwen-1.5B-q4','nemotron-writing-latin'];
  const results = [];
  const writelyDir = getModelsDir();
  const home = os.homedir();
  const hfCacheDirs = [
    path.join(home, '.cache', 'huggingface', 'hub'),
    path.join(home, 'Library', 'Caches', 'huggingface', 'hub'),
    path.join(home, '.cache', 'lm-studio', 'models'),
  ];
  const ollamaDir = path.join(home, '.ollama', 'models');

  function existsAnywhere(id) {
    // 1) Writely dir
    try {
      const p = getModelPath(id);
      if (fs.existsSync(p)) {
        const st = fs.statSync(p);
        if (st.size > 1024 * 1024) return { found: true, path: p, source: 'writely-dir', sizeBytes: st.size };
      }
      // also check directory contains any .gguf/.onnx
      const dir = path.join(writelyDir, id);
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        const hit = files.find(f => f.endsWith('.gguf') || f.endsWith('.onnx') || f.endsWith('.bin'));
        if (hit) {
          const fp = path.join(dir, hit);
          const st = fs.statSync(fp);
          if (st.size > 1024 * 1024) return { found: true, path: fp, source: 'writely-dir', sizeBytes: st.size };
        }
      }
    } catch {}
    // 2) HF cache (fuzzy: look for any dir containing model key)
    for (const base of hfCacheDirs) {
      try {
        if (!fs.existsSync(base)) continue;
        const entries = fs.readdirSync(base);
        const key = id.toLowerCase().replace(/[^a-z0-9]/g, '');
        const hit = entries.find(e => e.toLowerCase().replace(/[^a-z0-9]/g,'').includes(key));
        if (hit) {
          const hitPath = path.join(base, hit);
          return { found: true, path: hitPath, source: 'hf-cache' };
        }
        // also check aliases
        const aliases = EXTERNAL_ALIASES_MAIN[id] || [];
        for (const alias of aliases) {
          const akey = alias.toLowerCase().replace(/[^a-z0-9]/g,'');
          const hit2 = entries.find(e => e.toLowerCase().replace(/[^a-z0-9]/g,'').includes(akey));
          if (hit2) return { found: true, path: path.join(base, hit2), source: 'hf-cache' };
        }
      } catch {}
    }
    // 3) Ollama — check blobs/manifests
    try {
      if (fs.existsSync(ollamaDir)) {
        const aliases = EXTERNAL_ALIASES_MAIN[id] || [id];
        // Ollama stores models/ manifests under models/manifests/registry.ollama.ai/library/...
        const manifestsRoot = path.join(ollamaDir, 'manifests', 'registry.ollama.ai', 'library');
        if (fs.existsSync(manifestsRoot)) {
          const libs = fs.readdirSync(manifestsRoot);
          for (const alias of aliases) {
            const norm = alias.split(':')[0].toLowerCase();
            if (libs.some(l => l.toLowerCase().includes(norm))) {
              return { found: true, path: path.join(manifestsRoot, libs.find(l=>l.toLowerCase().includes(norm))), source: 'ollama' };
            }
          }
        }
      }
    } catch {}
    return { found: false, source: 'writely-dir' };
  }

  for (const id of allIds) {
    const info = existsAnywhere(id);
    // built-ins are always considered found
    if (id === 'writely-gector-80M-int8' || id === 'apple-speech-writing' || id === 'writely-qwen-0.5B-q4') {
      results.push({ id, found: true, path: info.path || 'built-in', source: 'built-in', sizeBytes: info.sizeBytes });
    } else {
      results.push({ id, found: info.found, path: info.path, source: info.source, sizeBytes: info.sizeBytes });
    }
  }
  return results;
}

// Download helper — streams HF URL to models dir with progress via webContents
const https = require('https');
const http = require('http');
async function downloadModelToDisk(modelId, sender) {
  // Registry map (must match models/registry.json urls)
  const urls = {
    'qwen3-4b': 'https://huggingface.co/Qwen/Qwen3-4B-GGUF/resolve/main/qwen3-4b-q4_k_m.gguf',
    'qwen3-8b': 'https://huggingface.co/Qwen/Qwen3-8B-GGUF/resolve/main/qwen3-8b-q4_k_m.gguf',
    'mistral-3-3b': 'https://huggingface.co/mistralai/Mistral-3-3B-GGUF/resolve/main/mistral-3-3b-q4_k_m.gguf',
    'mistral-3-8b': 'https://huggingface.co/mistralai/Mistral-3-8B-GGUF/resolve/main/mistral-3-8b-q4_k_m.gguf',
    'qwen3-14b': 'https://huggingface.co/Qwen/Qwen3-14B-GGUF/resolve/main/qwen3-14b-q4_k_m.gguf',
    'mistral-3-14b': 'https://huggingface.co/mistralai/Mistral-3-14B-GGUF/resolve/main/mistral-3-14b-q4_k_m.gguf',
    'writely-qwen-0.5B-q4': 'https://huggingface.co/writely-ai/qwen-0.5b-q4/resolve/main/model.gguf',
    'writely-qwen-1.5B-q4': 'https://huggingface.co/writely-ai/qwen-1.5b-q4/resolve/main/model.gguf',
    'llama-32-1b-writing': 'https://huggingface.co/meta-llama/Llama-3.2-1B-GGUF/resolve/main/llama-3.2-1b-q4_k_m.gguf',
    'nemotron-writing-latin': 'https://huggingface.co/nvidia/Nemotron-Mini-4B-GGUF/resolve/main/model.gguf',
  };
  const url = urls[modelId];
  if (!url) throw new Error(`No download URL for ${modelId}`);
  const destDir = path.join(getModelsDir(), modelId);
  fs.mkdirSync(destDir, { recursive: true });
  const dest = path.join(destDir, 'model.gguf');
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // follow redirect once
        const redir = res.headers.location;
        const p2 = redir.startsWith('https') ? https : http;
        const r2 = p2.get(redir, (res2) => handleResponse(res2, dest, sender, resolve, reject));
        r2.on('error', reject);
        return;
      }
      handleResponse(res, dest, sender, resolve, reject);
    });
    req.on('error', reject);
  });
}
function handleResponse(res, dest, sender, resolve, reject) {
  if (res.statusCode !== 200) {
    reject(new Error(`Download failed HTTP ${res.statusCode}`));
    return;
  }
  const total = parseInt(res.headers['content-length'] || '0', 10);
  let downloaded = 0;
  const file = fs.createWriteStream(dest);
  res.on('data', (chunk) => {
    downloaded += chunk.length;
    if (total && sender && !sender.isDestroyed()) {
      const pct = Math.round((downloaded / total) * 100);
      sender.send('writely:download-progress', { id: dest.split(path.sep).slice(-2)[0], percent: pct });
    }
  });
  res.pipe(file);
  file.on('finish', () => file.close(() => resolve(true)));
  file.on('error', (err) => { try { fs.unlinkSync(dest); } catch {} reject(err); });
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
  ipcMain.handle('writely:scanModels', async () => {
    return scanModelsOnDisk();
  });
  ipcMain.handle('writely:getModelsDir', async () => getModelsDir());
  ipcMain.handle('writely:downloadModel', async (event, modelId) => {
    const sender = event.sender;
    try {
      await downloadModelToDisk(modelId, sender);
      return true;
    } catch (e) {
      console.error('[download]', e);
      throw e;
    }
  });
  ipcMain.handle('writely:deleteModel', async (_e, modelId) => {
    try {
      const p = getModelPath(modelId);
      if (fs.existsSync(p)) fs.unlinkSync(p);
      const dir = path.join(getModelsDir(), modelId);
      if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
      return true;
    } catch (e) { console.error('[delete]', e); return false; }
  });
  ipcMain.handle('writely:linkExternalModel', async (_e, modelId, externalPath) => {
    // Create a symlink or marker so future scans know it's linked
    try {
      const dir = path.join(getModelsDir(), modelId);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, '.external-link'), externalPath, 'utf8');
      return true;
    } catch { return false; }
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
