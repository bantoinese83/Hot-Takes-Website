const EXPLICIT_OLLAMA_BASE = import.meta.env.VITE_OLLAMA_BASE_URL as string | undefined;
const OLLAMA_BASE = EXPLICIT_OLLAMA_BASE?.replace(/\/$/, '') ?? '/ollama';

/** True when the app can reach Ollama (dev proxy or explicit URL). */
export function intelOllamaAvailable(): boolean {
  if (EXPLICIT_OLLAMA_BASE?.trim()) return true;
  return import.meta.env.DEV;
}

export function intelOllamaUnavailableMessage(): string {
  return (
    'Intel only works with local Ollama. Open http://localhost:5173/admin/intel while running ' +
    '`npm run dev` on your Mac (Ollama app running). The deployed site cannot proxy to your machine.'
  );
}

export type OllamaModel = {
  name: string;
  size?: number;
  modified_at?: string;
};

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

async function readOllamaJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  const head = text.trimStart().slice(0, 32).toLowerCase();
  if (head.startsWith('<!doctype') || head.startsWith('<html')) {
    throw new Error(intelOllamaUnavailableMessage());
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Ollama returned non-JSON (${res.status}). ${intelOllamaAvailable() ? 'Is Ollama running?' : intelOllamaUnavailableMessage()}`,
    );
  }
}

export async function ollamaHealth(): Promise<{ ok: boolean; models: OllamaModel[]; error?: string }> {
  if (!intelOllamaAvailable()) {
    return { ok: false, models: [], error: intelOllamaUnavailableMessage() };
  }

  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) {
      const hint = await res.text().catch(() => '');
      return {
        ok: false,
        models: [],
        error: hint.trimStart().startsWith('<')
          ? intelOllamaUnavailableMessage()
          : `HTTP ${res.status}`,
      };
    }
    const data = await readOllamaJson<{ models?: { name: string; size?: number; modified_at?: string }[] }>(res);
    const models = (data.models ?? []).map((m) => ({
      name: m.name,
      size: m.size,
      modified_at: m.modified_at,
    }));
    return { ok: true, models };
  } catch (e) {
    return {
      ok: false,
      models: [],
      error: e instanceof Error ? e.message : 'Cannot reach Ollama',
    };
  }
}

export function pickModel(requested: string, available: string[]): string {
  if (available.includes(requested)) return requested;
  const base = requested.split(':')[0];
  const fuzzy = available.find((n) => n === requested || n.startsWith(`${base}:`));
  if (fuzzy) return fuzzy;
  if (available.includes('llama3.1:8b')) return 'llama3.1:8b';
  if (available.includes('llama3.2:3b')) return 'llama3.2:3b';
  return available[0] ?? requested;
}

/** Team brief: one small model only — avoids swapping 8b/14b and OOM on 24GB Macs. */
export function pickBatchModel(available: string[]): string {
  for (const preferred of ['llama3.2:3b', 'llama3.1:8b'] as const) {
    if (available.includes(preferred)) return preferred;
  }
  return available[0] ?? 'llama3.2:3b';
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Free VRAM after each agent so the next run does not stack models in RAM. */
export async function ollamaUnloadModel(model: string): Promise<void> {
  if (!intelOllamaAvailable()) return;
  try {
    await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({ model, prompt: ' ', keep_alive: 0 }),
    });
  } catch {
    /* best-effort */
  }
  await sleep(1200);
}

export async function ollamaChat(params: {
  model: string;
  messages: ChatMessage[];
  onToken?: (chunk: string) => void;
  signal?: AbortSignal;
  keepAlive?: number | string;
  numPredict?: number;
}): Promise<string> {
  if (!intelOllamaAvailable()) {
    throw new Error(intelOllamaUnavailableMessage());
  }

  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: params.signal,
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      stream: Boolean(params.onToken),
      keep_alive: params.keepAlive ?? '5m',
      options: {
        temperature: 0.35,
        num_predict: params.numPredict ?? 2048,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    if (err.trimStart().toLowerCase().startsWith('<!doctype')) {
      throw new Error(intelOllamaUnavailableMessage());
    }
    throw new Error(err || `Ollama chat failed (${res.status})`);
  }

  if (!params.onToken) {
    const data = await readOllamaJson<{ message?: { content?: string } }>(res);
    return data.message?.content?.trim() ?? '';
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response stream');

  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      if (line.trimStart().toLowerCase().startsWith('<!doctype')) {
        throw new Error(intelOllamaUnavailableMessage());
      }
      try {
        const json = JSON.parse(line) as { message?: { content?: string }; done?: boolean };
        const piece = json.message?.content ?? '';
        if (piece) {
          full += piece;
          params.onToken(piece);
        }
      } catch {
        /* skip partial json */
      }
    }
  }
  return full.trim();
}
