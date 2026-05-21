const OLLAMA_BASE = (import.meta.env.VITE_OLLAMA_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '/ollama';

export type OllamaModel = {
  name: string;
  size?: number;
  modified_at?: string;
};

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export async function ollamaHealth(): Promise<{ ok: boolean; models: OllamaModel[]; error?: string }> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return { ok: false, models: [], error: `HTTP ${res.status}` };
    const data = (await res.json()) as { models?: { name: string; size?: number; modified_at?: string }[] };
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

export async function ollamaChat(params: {
  model: string;
  messages: ChatMessage[];
  onToken?: (chunk: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: params.signal,
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      stream: Boolean(params.onToken),
      options: { temperature: 0.35, num_predict: 2048 },
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || `Ollama chat failed (${res.status})`);
  }

  if (!params.onToken) {
    const data = (await res.json()) as { message?: { content?: string } };
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
