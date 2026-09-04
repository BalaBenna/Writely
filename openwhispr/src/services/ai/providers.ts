import { createOpenAI } from "@ai-sdk/openai";
import { createGroq } from "@ai-sdk/groq";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createCohere } from "@ai-sdk/cohere";
import type { LanguageModel } from "ai";
import { getTinfoilLanguageModel } from "./tinfoilClient";
import { API_ENDPOINTS } from "../../config/constants";

// Renderer-side AI SDK factory. Cloud + local only — enterprise providers
// (bedrock/azure/vertex) run in the main process via the
// `process-enterprise-reasoning` IPC because their SDKs depend on Node-only
// APIs (fs, process, AWS credential chain) that don't work in the browser.
// See `src/helpers/enterpriseAiProviders.js` for the main-process counterpart.

// OpenRouter's reasoning control is a top-level request field the AI SDK
// can't emit — inject it at the fetch boundary.
const withDisabledReasoning: typeof fetch = (input, init) => {
  if (typeof init?.body === "string") {
    try {
      const body = JSON.parse(init.body);
      body.reasoning = { enabled: false };
      init = { ...init, body: JSON.stringify(body) };
    } catch {}
  }
  return fetch(input, init);
};

export async function getAIModel(
  provider: string,
  model: string,
  apiKey: string,
  baseURL?: string,
  opts?: { disableThinking?: boolean }
): Promise<LanguageModel> {
  switch (provider) {
    case "openai":
      return createOpenAI({ apiKey })(model);
    case "groq":
      return createGroq({ apiKey })(model);
    case "anthropic":
      // The assistant panel runs in the pill window, which keeps Chromium's
      // default webSecurity (the deleted agent overlay disabled it). Anthropic
      // only answers browser-origin requests that opt in with this header;
      // the dictation path avoids the issue by going through IPC.
      return createAnthropic({
        apiKey,
        headers: { "anthropic-dangerous-direct-browser-access": "true" },
      })(model);
    case "gemini":
      return createGoogleGenerativeAI({ apiKey })(model);
    case "tinfoil":
      return getTinfoilLanguageModel(apiKey, model);
    case "corti":
      // Corti's gateway is Chat Completions-compatible, not the OpenAI Responses API.
      return createOpenAI({ apiKey, baseURL: API_ENDPOINTS.CORTI_MODELS_BASE }).chat(model);
    case "custom":
      // Custom OpenAI-compatible servers implement Chat Completions, not the Responses API.
      return createOpenAI({ apiKey, baseURL }).chat(model);
    case "openrouter":
      // OpenRouter implements Chat Completions, not the OpenAI Responses API.
      return createOpenAI({
        apiKey,
        baseURL,
        ...(opts?.disableThinking ? { fetch: withDisabledReasoning } : {}),
      }).chat(model);
    case "local":
      return createOpenAI({ apiKey: apiKey || "no-key", baseURL }).chat(model);
    // Writely writing-assistant providers — all OpenAI-compatible chat
    // completions except Cohere, which uses its native chat API.
    case "deepseek":
      return createOpenAI({ apiKey, baseURL: baseURL || API_ENDPOINTS.DEEPSEEK_BASE }).chat(model);
    case "fireworks":
      return createOpenAI({ apiKey, baseURL: baseURL || API_ENDPOINTS.FIREWORKS_BASE }).chat(model);
    case "together":
      return createOpenAI({ apiKey, baseURL: baseURL || API_ENDPOINTS.TOGETHER_BASE }).chat(model);
    case "minimax":
      return createOpenAI({ apiKey, baseURL: baseURL || API_ENDPOINTS.MINIMAX_BASE }).chat(model);
    case "mistral":
      return createOpenAI({ apiKey, baseURL: baseURL || API_ENDPOINTS.MISTRAL_BASE }).chat(model);
    case "perplexity":
      return createOpenAI({ apiKey, baseURL: baseURL || API_ENDPOINTS.PERPLEXITY_BASE }).chat(model);
    case "xai":
      return createOpenAI({ apiKey, baseURL: baseURL || API_ENDPOINTS.XAI_BASE }).chat(model);
    case "cohere":
      // Cohere's SDK speaks v2 spec; bridge to this factory's v4 LanguageModel type.
      return createCohere({ apiKey })(model) as unknown as LanguageModel;
    default:
      throw new Error(`Unsupported AI SDK provider for renderer: ${provider}`);
  }
}
