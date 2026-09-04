// systemCapture.cjs — OS-level text capture for Grammarly-style system-wide fixes.
// Strategy: clipboard fallback (no native addon / node-gyp needed).
//   capture: save clipboard → simulate Cmd/Ctrl+C → read clipboard → restore
//   replace: write corrected → simulate Cmd/Ctrl+V → restore original clipboard
// macOS needs Accessibility permission for System Events keystrokes (one-time
// grant in System Settings → Privacy & Security → Accessibility).
const { execFile } = require('child_process');
const { promisify } = require('util');
const os = require('os');

const execFileAsync = promisify(execFile);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const platform = os.platform(); // 'darwin' | 'win32' | 'linux'

async function simulateCopy() {
  if (platform === 'darwin') {
    await execFileAsync('osascript', ['-e', 'tell application "System Events" to keystroke "c" using command down']);
  } else if (platform === 'win32') {
    await execFileAsync('powershell', ['-NoProfile', '-Command', "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^{c}')"]);
  } else {
    // Linux: try xdotool copy; primary selection is read directly in getSelectedText
    try {
      await execFileAsync('xdotool', ['key', 'ctrl+c']);
    } catch (_) {}
  }
}

async function simulatePaste() {
  if (platform === 'darwin') {
    await execFileAsync('osascript', ['-e', 'tell application "System Events" to keystroke "v" using command down']);
  } else if (platform === 'win32') {
    await execFileAsync('powershell', ['-NoProfile', '-Command', "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^{v}')"]);
  } else {
    try {
      await execFileAsync('xdotool', ['key', 'ctrl+v']);
    } catch (_) {}
  }
}

// Capture currently-selected text in ANY focused app. Returns '' when nothing
// selected, app is secure (password fields), or permission missing.
async function getSelectedText(clipboard) {
  // Linux primary selection: no keystroke needed
  if (platform === 'linux') {
    try {
      const { stdout } = await execFileAsync('xclip', ['-o', '-selection', 'primary']);
      if (stdout) return stdout;
    } catch (_) {}
  }
  let saved = '';
  try { saved = clipboard.readText() || ''; } catch (_) {}
  try { clipboard.clear(); } catch (_) {}
  try {
    await simulateCopy();
  } catch (e) {
    try { if (saved) clipboard.writeText(saved); } catch (_) {}
    throw e;
  }
  await sleep(280);
  let selected = '';
  try { selected = clipboard.readText() || ''; } catch (_) {}
  // Restore user's original clipboard (the copy was only a probe)
  try { if (saved) clipboard.writeText(saved); } catch (_) {}
  return selected;
}

// Replace current selection in ANY focused app with corrected text.
async function replaceSelectedText(clipboard, text) {
  let saved = '';
  try { saved = clipboard.readText() || ''; } catch (_) {}
  try { clipboard.writeText(text); } catch (e) { throw e; }
  await sleep(120);
  await simulatePaste();
  // Give the target app time to consume the paste, then restore clipboard
  await sleep(800);
  try { clipboard.writeText(saved); } catch (_) {}
}

async function getFocusedApplication() {
  try {
    if (platform === 'darwin') {
      const { stdout } = await execFileAsync('osascript', ['-e', 'tell application "System Events" to get name of first application process whose frontmost is true']);
      const name = (stdout || '').trim();
      return name ? { name } : null;
    }
    if (platform === 'win32') {
      const { stdout } = await execFileAsync('powershell', ['-NoProfile', '-Command',
        "Add-Type @'\nusing System;\nusing System.Runtime.InteropServices;\nusing System.Text;\npublic static class FG { [DllImport(\"user32.dll\")] public static extern IntPtr GetForegroundWindow(); [DllImport(\"user32.dll\")] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n); }\n'@; $h=[FG]::GetForegroundWindow(); $sb=New-Object Text.StringBuilder 512; [FG]::GetWindowText($h,$sb,512)|Out-Null; $sb.ToString()"]);
      const name = (stdout || '').trim();
      return name ? { name } : null;
    }
    // Linux best-effort
    const { stdout } = await execFileAsync('xdotool', ['getwindowfocus', 'getwindowname']);
    const name = (stdout || '').trim();
    return name ? { name } : null;
  } catch (_) {
    return null;
  }
}

// macOS Accessibility gate. Windows/Linux need no special grant for SendKeys.
async function checkAccessibility() {
  if (platform !== 'darwin') return { granted: true, platform };
  try {
    await execFileAsync('osascript', ['-e', 'tell application "System Events" to keystroke ""']);
    return { granted: true, platform };
  } catch (e) {
    const msg = `${(e && e.stderr) || ''} ${(e && e.message) || ''}`;
    const denied = /not allowed assistive access|not permitted|1002|denied/i.test(msg);
    return { granted: !denied, platform, hint: denied ? 'System Settings → Privacy & Security → Accessibility → enable Writely' : msg.slice(0, 200) };
  }
}

module.exports = {
  platform,
  getSelectedText,
  replaceSelectedText,
  getFocusedApplication,
  checkAccessibility,
};
