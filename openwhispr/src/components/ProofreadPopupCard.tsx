import { useEffect, useState } from "react";
import { Check, Copy, Loader2, X } from "lucide-react";
import { cn } from "./lib/utils";
import {
  analyzeDocument,
  applyAllSuggestions,
  type ProofreadResult,
} from "../proofread/proofreadEngine";
import { WritingAssistService } from "../services/WritingAssistService";
import type { ToneStyle } from "../proofread/proofreadTypes";
import { TRANSLATE_LANGUAGES } from "../proofread/writeLanguages";
import type { ProofreadPopupData } from "../types/electron";

interface ProofreadPopupCardProps {
  data: ProofreadPopupData;
  onAccept: (correctedText: string) => void;
  onDismiss: () => void;
  busy: boolean;
}

type TabId = "improve" | "rephrase" | "shorten" | "friendly" | "formal" | "translate";

const TABS: { id: TabId; label: string }[] = [
  { id: "improve", label: "Improve" },
  { id: "rephrase", label: "Rephrase" },
  { id: "translate", label: "Translate" },
  { id: "shorten", label: "Shorten" },
  { id: "friendly", label: "Friendly" },
  { id: "formal", label: "Formal" },
];

const TAB_TONE: Partial<Record<TabId, ToneStyle>> = {
  rephrase: "professional",
  shorten: "concise",
  friendly: "friendly",
  formal: "academic",
};

const DEFAULT_LANG = "Spanish";

export function ProofreadPopupCard({ data, onAccept, onDismiss, busy }: ProofreadPopupCardProps) {
  const [tab, setTab] = useState<TabId>("improve");
  const [result, setResult] = useState<ProofreadResult | null>(null);
  const [toneText, setToneText] = useState<string | null>(null);
  const [toneProvider, setToneProvider] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState(DEFAULT_LANG);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setResult(analyzeDocument(data.text));
    setTab("improve");
    setToneText(null);
    setError(null);
  }, [data.text, data.sessionId]);

  const suggestions = result?.suggestions ?? [];
  const fullyCorrected = result ? applyAllSuggestions(data.text, suggestions) : data.text;

  const runCloudTab = async (nextTab: TabId, nextLang: string = lang) => {
    setTab(nextTab);
    setError(null);
    if (nextTab === "improve") return;
    setLoading(true);
    try {
      if (nextTab === "translate") {
        const r = await WritingAssistService.translate(data.text, nextLang);
        setToneText(r.translated);
        setToneProvider(r.providerUsed);
      } else {
        const r = await WritingAssistService.rewrite(data.text, TAB_TONE[nextTab] ?? "professional");
        setToneText(r.rewritten);
        setToneProvider(r.providerUsed);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rewrite failed — check provider key/model in Settings.");
      setToneText(null);
    } finally {
      setLoading(false);
    }
  };

  const currentText = tab === "improve" ? fullyCorrected : (toneText ?? data.text);
  const canAccept = tab === "improve" ? suggestions.length > 0 : toneText !== null && toneText !== data.text;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-modal">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="text-xs font-semibold">
          {tab === "improve" ? (
            result === null ? (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking…
              </span>
            ) : suggestions.length === 0 ? (
              <span className="text-success">Looks good — no issues found</span>
            ) : (
              <span>
                {suggestions.length} suggestion{suggestions.length > 1 ? "s" : ""}
              </span>
            )
          ) : (
            <span className="text-muted-foreground">
              {TABS.find((t) => t.id === tab)?.label}
              {toneProvider ? ` · ${toneProvider}` : ""}
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

      <div className="flex items-center gap-3 overflow-hidden border-b border-border px-3 pt-2 text-xs">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => void runCloudTab(t.id)}
            className={cn(
              "whitespace-nowrap pb-2 transition-colors",
              tab === t.id
                ? "-mb-px border-b-2 border-foreground font-bold text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {tab === "improve" && (
          <>
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
          </>
        )}

        {tab !== "improve" && (
          <div className="space-y-2 px-1 py-1">
            {tab === "translate" && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Target</span>
                <select
                  value={lang}
                  disabled={loading || busy}
                  onChange={(e) => {
                    const next = e.target.value;
                    setLang(next);
                    void runCloudTab("translate", next);
                  }}
                  className="rounded-md border border-border bg-card px-1.5 py-1 text-xs text-foreground"
                >
                  {TRANSLATE_LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {loading ? (
              <p className="flex items-center justify-center gap-1.5 py-4 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Working…
              </p>
            ) : error ? (
              <p className="py-2 text-xs leading-relaxed text-destructive">{error}</p>
            ) : toneText !== null ? (
              <p className="whitespace-pre-wrap break-words text-xs leading-relaxed">{toneText}</p>
            ) : (
              <p className="py-2 text-xs text-muted-foreground">Preparing…</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border px-2 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={onDismiss}
            disabled={busy}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
          >
            Dismiss
          </button>
          <button
            onClick={handleCopy}
            disabled={busy || (tab !== "improve" && toneText === null)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
            title="Copy suggestion"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
        {tab === "improve" ? (
          <button
            onClick={() => onAccept(fullyCorrected)}
            disabled={busy || result === null || suggestions.length === 0}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "Applying…" : `Fix All (${suggestions.length})`}
          </button>
        ) : (
          <button
            onClick={() => toneText !== null && onAccept(toneText)}
            disabled={busy || loading || toneText === null || toneText === data.text}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "Applying…" : "Insert"}
          </button>
        )}
      </div>
    </div>
  );
}
