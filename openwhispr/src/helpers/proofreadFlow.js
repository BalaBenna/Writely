const debugLogger = require("./debugLogger");

// Writely fix-anywhere flow: capture the user's current selection in ANY app,
// then surface the proofread popup next to the cursor. Correction itself runs
// inside the popup window (renderer) via ProofreadService — main only moves
// text between the target app and the popup.
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
    return { ok: false, code: "capture_failed" };
  }
  if (!capture || capture.status !== "selected" || !capture.text?.trim()) {
    return { ok: false, code: capture?.status || "no_selection" };
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
