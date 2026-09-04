import { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "./lib/utils";
import {
  analyzeDocument,
  applyAllSuggestions,
  type ProofreadResult,
} from "../proofread/proofreadEngine";
import type { ProofreadPopupData } from "../types/electron";

interface ProofreadPopupCardProps {
  data: ProofreadPopupData;
  onAccept: (correctedText: string) => void;
  onDismiss: () => void;
  busy: boolean;
}

export function ProofreadPopupCard({ data, onAccept, onDismiss, busy }: ProofreadPopupCardProps) {
  const [result, setResult] = useState<ProofreadResult | null>(null);

  useEffect(() => {
    setResult(analyzeDocument(data.text));
  }, [data.text]);

  const suggestions = result?.suggestions ?? [];
  const fullyCorrected = result ? applyAllSuggestions(data.text, suggestions) : data.text;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-modal">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="text-xs font-semibold">
          {result === null ? (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking…
            </span>
          ) : suggestions.length === 0 ? (
            <span className="text-success">Looks good — no issues found</span>
          ) : (
            <span>
              {suggestions.length} suggestion{suggestions.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          onClick={onDismiss}
          disabled={busy}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          title="Dismiss (Esc)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {result !== null && suggestions.length === 0 && (
          <p className="px-1 py-3 text-center text-xs text-muted-foreground">
            Nothing to fix in this selection.
          </p>
        )}
        <ul className="space-y-1">
          {suggestions.slice(0, 8).map((s) => (
            <li key={s.id}>
              <button
                onClick={() => onAccept(applyAllSuggestions(data.text, [s]))}
                disabled={busy}
                className="group flex w-full items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left hover:border-border-hover hover:bg-muted disabled:opacity-40"
                title="Apply this fix"
              >
                <span className="min-w-0 flex-1 truncate text-xs">
                  <s className="text-destructive/80">{s.original}</s>
                  <span className="mx-1 text-muted-foreground">→</span>
                  <b className="font-semibold text-success">{s.replacement}</b>
                </span>
                <Check className="h-3.5 w-3.5 shrink-0 text-success opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
              <p className="truncate px-2 pb-1 text-[11px] text-muted-foreground">{s.explanation}</p>
            </li>
          ))}
        </ul>
        {suggestions.length > 8 && (
          <p className="px-2 py-1 text-center text-[11px] text-muted-foreground">
            +{suggestions.length - 8} more via Fix All
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border px-2 py-2">
        <button
          onClick={onDismiss}
          disabled={busy}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground",
            "hover:bg-muted hover:text-foreground disabled:opacity-40"
          )}
        >
          Dismiss
        </button>
        <button
          onClick={() => onAccept(fullyCorrected)}
          disabled={busy || result === null || suggestions.length === 0}
          className={cn(
            "rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground",
            "hover:opacity-90 disabled:opacity-40"
          )}
        >
          {busy ? "Applying…" : `Fix All (${suggestions.length})`}
        </button>
      </div>
    </div>
  );
}
