import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { ChatMessage } from './ollamaClient';

export type GeminiIntelHealth = {
  ok: boolean;
  model: string;
  configured: boolean;
  error?: string;
};

export async function geminiIntelHealth(): Promise<GeminiIntelHealth> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, model: 'gemini-3.5-flash', configured: false, error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('admin-intel', {
      body: { health_check: true },
    });
    if (error) {
      return {
        ok: false,
        model: 'gemini-3.5-flash',
        configured: false,
        error: error.message,
      };
    }
    const row = data as { ok?: boolean; model?: string; configured?: boolean; error?: string };
    return {
      ok: Boolean(row?.configured && row?.ok !== false),
      model: row?.model ?? 'gemini-3.5-flash',
      configured: Boolean(row?.configured),
      error: row?.error,
    };
  } catch (e) {
    return {
      ok: false,
      model: 'gemini-3.5-flash',
      configured: false,
      error: e instanceof Error ? e.message : 'Cannot reach admin-intel',
    };
  }
}

export async function geminiIntelChat(params: {
  messages: ChatMessage[];
  signal?: AbortSignal;
  maxOutputTokens?: number;
  thinkingLevel?: 'minimal' | 'low' | 'medium' | 'high';
}): Promise<{ text: string; model: string }> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.functions.invoke('admin-intel', {
    body: {
      messages: params.messages,
      max_output_tokens: params.maxOutputTokens ?? 2048,
      thinking_level: params.thinkingLevel ?? 'low',
    },
  });

  if (error) throw new Error(error.message);

  const row = data as { ok?: boolean; text?: string; model?: string; error?: string };
  if (row?.error) throw new Error(row.error);
  if (!row?.ok || !row.text?.trim()) {
    throw new Error('Gemini returned no content. Check GEMINI_API_KEY on Supabase.');
  }
  return { text: row.text.trim(), model: row.model ?? 'gemini-3.5-flash' };
}
