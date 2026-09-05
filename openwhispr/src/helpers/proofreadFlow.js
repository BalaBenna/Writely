const debugLogger = require("./debugLogger");

let Notification = null;
try {
  ({ Notification } = require("electron"));
} catch {}

function notifyUser(title, body) {
  try {
    if (Notification) new Notification({ title, body }).show();
  } catch {}
}

// Writely fix-anywhere flow: capture the user's current selection in ANY app,
// then surface the proofread popup next to the cursor. Correction itself runs
// inside the popup window (renderer) via ProofreadService — main only moves
// text between the target app and the popup.
//
// NOTE: callers must snapshot the target at hotkey-press time first
// (textEditMonitor.captureTargetPid on macOS, selectionManager.captureTarget
// elsewhere) — otherwise captureSelectedText sees no target and reports
// target_unavailable.
async function runProofreadFix({ selectionManager, windowManager }) {
  if (!selectionManager || !windowManager) {
    debugLogger.warn("Proofread unavailable: managers missing", {}, "proofread");
    return { ok: false, code: "unavailable" };
  }
  let capture;
  try {
    capture = await selectionManager.captureSelectedText({});
  } catch (error) {
    debugLogger.warn("Proofread capture threw", { error: error?.message }, "proofread");
    notifyUser("Writely", "Could not read the selected text. Grant Accessibility access and try again.");
    return { ok: false, code: "capture_failed" };
  }
  if (!capture || capture.status !== "selected" || !capture.text?.trim()) {
    const code = capture?.status || "no_selection";
    if (code === "target_unavailable" || code === "no_selection" || code === "unavailable") {
      notifyUser(
        "Writely",
        "Select some text in any app first, then press the Fix-Anywhere hotkey."
      );
    }
    return { ok: false, code };
  }
  const text = capture.text.length > 5000 ? capture.text.slice(0, 5000) : capture.text;
  try {
    const shown = await windowManager.showProofreadPopup({
      sessionId: capture.sessionId,
      text,
      characterCount: capture.characterCount,
    });
    return { ok: shown !== false, code: shown === false ? "suppressed" : "shown" };
  } catch (error) {
    debugLogger.warn("Proofread popup failed", { error: error?.message }, "proofread");
    return { ok: false, code: "popup_failed" };
  }
}

module.exports = { runProofreadFix };
