import { geminiIntelHealth } from './geminiIntel';
import { intelOllamaAvailable, ollamaHealth } from './ollamaClient';

export type IntelProviderId = 'ollama' | 'gemini';

export type IntelRuntime = {
  provider: IntelProviderId;
  label: string;
  detail: string;
  ollamaModels: string[];
  geminiModel: string;
  geminiConfigured: boolean;
  canRun: boolean;
};

/** Local Ollama when dev proxy + daemon are up; otherwise Gemini on Supabase. */
export async function resolveIntelRuntime(): Promise<IntelRuntime> {
  const gemini = await geminiIntelHealth();

  if (intelOllamaAvailable()) {
    const ollama = await ollamaHealth();
    if (ollama.ok && ollama.models.length > 0) {
      return {
        provider: 'ollama',
        label: 'Local Ollama',
        detail: `${ollama.models.length} model(s) on this Mac · team brief uses llama3.2:3b`,
        ollamaModels: ollama.models.map((m) => m.name),
        geminiModel: gemini.model,
        geminiConfigured: gemini.configured,
        canRun: true,
      };
    }
  }

  if (gemini.ok) {
    return {
      provider: 'gemini',
      label: 'Gemini (cloud)',
      detail: `${gemini.model} · thinking low · for hottakdate.com & when Ollama is offline`,
      ollamaModels: [],
      geminiModel: gemini.model,
      geminiConfigured: true,
      canRun: true,
    };
  }

  const ollamaHint = intelOllamaAvailable()
    ? 'Start Ollama (npm run dev) or set GEMINI_API_KEY on Supabase.'
    : 'Deploy admin-intel and set GEMINI_API_KEY in Supabase secrets.';

  return {
    provider: 'gemini',
    label: 'Unavailable',
    detail: gemini.error ?? ollamaHint,
    ollamaModels: [],
    geminiModel: gemini.model,
    geminiConfigured: gemini.configured,
    canRun: false,
  };
}

export function providerModelLabel(
  provider: IntelProviderId,
  agentOllamaModel: string,
  geminiModel: string,
): string {
  return provider === 'ollama' ? agentOllamaModel : geminiModel;
}
