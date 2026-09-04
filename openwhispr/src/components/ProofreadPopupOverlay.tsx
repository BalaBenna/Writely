import { useCallback, useEffect, useState, type ReactElement } from "react";
import type { ProofreadPopupData } from "../types/electron";
import { ProofreadPopupCard } from "./ProofreadPopupCard";

// Transparent-overlay root for the Writely fix-anywhere popup. Mirrors the
// meeting-notification overlay contract: pull pending data, signal ready so
// main reveals the window, report accept/dismiss back over IPC.
export default function ProofreadPopupOverlay(): ReactElement {
  const [data, setData] = useState<ProofreadPopupData | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    window.electronAPI?.getProofreadData?.().then((pending) => {
      if (!cancelled && pending) setData(pending);
    });
    const unsubscribe = window.electronAPI?.onProofreadPopupData?.((incoming) => {
      if (!cancelled) {
        setData(incoming);
        setBusy(false);
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
      try {
        await window.electronAPI?.proofreadRespond?.({
          action: "accept",
          sessionId: data.sessionId,
          text: correctedText,
        });
      } catch {
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
    <div className="proofread-popup-window fixed inset-0 p-2">
      {data ? (
        <ProofreadPopupCard data={data} onAccept={handleAccept} onDismiss={handleDismiss} busy={busy} />
      ) : (
        <div className="flex h-full items-center justify-center rounded-xl border border-border bg-popover text-xs text-muted-foreground shadow-modal">
          Waiting for selection…
        </div>
      )}
    </div>
  );
}
