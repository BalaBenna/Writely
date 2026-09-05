import { useCallback, useEffect, useState, type ReactElement } from "react";
import type { ProofreadPopupData } from "../types/electron";
import { ProofreadPopupCard } from "./ProofreadPopupCard";

// Transparent-overlay root for the Writely fix-anywhere popup. Mirrors the
// meeting-notification overlay contract: pull pending data, signal ready so
// main reveals the window, report accept/dismiss back over IPC.
export default function ProofreadPopupOverlay(): ReactElement {
  const [data, setData] = useState<ProofreadPopupData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    window.electronAPI?.getProofreadData?.().then((pending) => {
      if (!cancelled && pending) setData(pending);
    });
    const unsubscribe = window.electronAPI?.onProofreadPopupData?.((incoming) => {
      if (!cancelled) {
        setData(incoming);
        setBusy(false);
        setError(null);
      }
    });
    window.electronAPI?.proofreadReady?.();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") void handleDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, busy]);

  const handleAccept = useCallback(
    async (correctedText: string) => {
      if (!data || busy) return;
      setBusy(true);
      setError(null);
      try {
        const res = await window.electronAPI?.proofreadRespond?.({
          action: "accept",
          sessionId: data.sessionId,
          text: correctedText,
        });
        // Main closes this window only on success. On failure (expired
        // session, target switched apps) stay open and say why.
        if (res && res.success === false) {
          setError(
            res.code === "session_expired"
              ? "That took too long — the selection expired. Press the hotkey on the text again."
              : res.code === "target_changed"
                ? "You switched apps — press the hotkey on the text again."
                : "Could not paste there. Copy the suggestion instead, or press the hotkey again."
          );
          setBusy(false);
        }
      } catch {
        setError("Could not reach the app. Press the hotkey on the text again.");
        setBusy(false);
      }
    },
    [data, busy]
  );

  const handleDismiss = useCallback(async () => {
    if (busy) return;
    try {
      await window.electronAPI?.proofreadRespond?.({ action: "dismiss" });
    } catch {}
  }, [busy]);

  return (
    <div className="proofread-popup-window fixed inset-0 flex flex-col gap-2 p-2">
      {error && (
        <div className="shrink-0 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive shadow-modal">
          {error}
        </div>
      )}
      <div className="min-h-0 flex-1">
        {data ? (
          <ProofreadPopupCard data={data} onAccept={handleAccept} onDismiss={handleDismiss} busy={busy} />
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-border bg-popover text-xs text-muted-foreground shadow-modal">
            Waiting for selection…
          </div>
        )}
      </div>
    </div>
  );
}
