import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ExternalLink, KeyRound } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  WRITE_PROVIDERS,
  getWriteEngineSelection,
  setWriteEngineSelection,
} from "../proofread/providerCatalog";
import { useSettingsStore } from "../stores/settingsStore";

const KEY_VALUES: Record<string, (s: ReturnType<typeof useSettingsStore.getState>) => string> = {
  openai: (s) => s.openaiApiKey,
  anthropic: (s) => s.anthropicApiKey,
  gemini: (s) => s.geminiApiKey,
  groq: (s) => s.groqApiKey,
  openrouter: (s) => s.openrouterApiKey,
  deepseek: (s) => s.deepseekApiKey,
  fireworks: (s) => s.fireworksApiKey,
  together: (s) => s.togetherApiKey,
  minimax: (s) => s.minimaxApiKey,
  mistral: (s) => s.mistralApiKey,
  perplexity: (s) => s.perplexityApiKey,
  cohere: (s) => s.cohereApiKey,
  xai: (s) => s.xaiApiKey,
};

/** Writing-assistant provider picker: engine selection + BYOK key, keyring-backed. */
export function WritingProviderSection() {
  const { t } = useTranslation();
  const [sel, setSel] = useState(getWriteEngineSelection);
  const [draftKey, setDraftKey] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  const store = useSettingsStore();
  const spec = useMemo(
    () => WRITE_PROVIDERS.find((p) => p.id === sel.provider) ?? WRITE_PROVIDERS[0],
    [sel.provider]
  );
  const savedKeyPresent = (KEY_VALUES[spec.id]?.(store) ?? "").length > 0;

  const pickProvider = (id: string) => {
    const next = WRITE_PROVIDERS.find((p) => p.id === id);
    if (!next) return;
    const nextSel = { provider: id, model: next.models[0]?.id ?? "" };
    setSel(nextSel);
    setWriteEngineSelection(nextSel);
    setDraftKey("");
    setSavedFlash(false);
  };

  const pickModel = (model: string) => {
    const nextSel = { ...sel, model };
    setSel(nextSel);
    setWriteEngineSelection(nextSel);
  };

  const setters: Record<string, (key: string) => void> = {
    openai: store.setOpenaiApiKey,
    anthropic: store.setAnthropicApiKey,
    gemini: store.setGeminiApiKey,
    groq: store.setGroqApiKey,
    openrouter: store.setOpenrouterApiKey,
    deepseek: store.setDeepseekApiKey,
    fireworks: store.setFireworksApiKey,
    together: store.setTogetherApiKey,
    minimax: store.setMinimaxApiKey,
    mistral: store.setMistralApiKey,
    perplexity: store.setPerplexityApiKey,
    cohere: store.setCohereApiKey,
    xai: store.setXaiApiKey,
  };

  const saveKey = () => {
    const set = setters[spec.id];
    if (!set || !draftKey.trim()) return;
    set(draftKey.trim());
    setDraftKey("");
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  };

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-foreground tracking-tight">
          {t("settingsPage.writing.title")}
        </h3>
        <p className="text-xs text-muted-foreground/80 mt-0.5 leading-relaxed">
          {t("settingsPage.writing.description")}
        </p>
      </div>
      <div className="rounded-lg border border-border/50 dark:border-border-subtle/70 bg-card/50 dark:bg-surface-2/50 backdrop-blur-sm divide-y divide-border/30 dark:divide-border-subtle/50">
        <div className="px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-muted-foreground">
                {t("settingsPage.writing.provider")}
              </span>
              <Select value={spec.id} onValueChange={pickProvider}>
                <SelectTrigger className="h-8 w-full text-xs rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WRITE_PROVIDERS.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-medium text-muted-foreground">
                {t("settingsPage.writing.model")}
              </span>
              <Select value={sel.model} onValueChange={pickModel}>
                <SelectTrigger className="h-8 w-full text-xs rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {spec.models.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      {m.name} · {m.context}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>
          <div>
            <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span className="flex items-center gap-1">
                <KeyRound className="h-3 w-3" />
                {t("settingsPage.writing.apiKey", { provider: spec.displayName })}
              </span>
              <a
                href={spec.keyUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-0.5 text-primary/80 hover:text-primary"
              >
                {t("settingsPage.writing.getKey")} <ExternalLink className="h-3 w-3" />
              </a>
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="password"
                value={draftKey}
                onChange={(e) => setDraftKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveKey();
                }}
                placeholder={savedKeyPresent ? "•••••••• (saved in keychain)" : spec.keyPlaceholder}
                className="h-8 font-mono text-xs"
              />
              <Button size="sm" variant="outline" onClick={saveKey} disabled={!draftKey.trim()}>
                {t("settingsPage.writing.save")}
              </Button>
              {(savedKeyPresent || savedFlash) && (
                <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-success">
                  <Check className="h-3.5 w-3.5" />
                  {savedFlash ? t("settingsPage.writing.saved") : t("settingsPage.writing.keySaved")}
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground/80">
              {t("settingsPage.writing.keychainNote")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
