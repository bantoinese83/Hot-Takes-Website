import { geminiIntelChat } from './geminiIntel';
import {
  ollamaChat,
  ollamaUnloadModel,
  pickBatchModel,
  pickModel,
  type ChatMessage,
} from './ollamaClient';
import { resolveIntelRuntime, type IntelProviderId } from './intelProvider';

export type { ChatMessage };

export async function intelChat(params: {
  provider: IntelProviderId;
  ollamaModels: string[];
  ollamaModel?: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
  onToken?: (chunk: string) => void;
  keepAlive?: number | string;
  numPredict?: number;
  geminiMaxTokens?: number;
}): Promise<{ text: string; provider: IntelProviderId; model: string }> {
  if (params.provider === 'ollama') {
    const model = pickModel(
      params.ollamaModel ?? pickBatchModel(params.ollamaModels),
      params.ollamaModels,
    );
    const text = await ollamaChat({
      model,
      messages: params.messages,
      signal: params.signal,
      onToken: params.onToken,
      keepAlive: params.keepAlive,
      numPredict: params.numPredict,
    });
    return { text, provider: 'ollama', model };
  }

  const result = await geminiIntelChat({
    messages: params.messages,
    signal: params.signal,
    maxOutputTokens: params.geminiMaxTokens ?? params.numPredict ?? 2048,
    thinkingLevel: 'low',
  });
  if (params.onToken && result.text) params.onToken(result.text);
  return { text: result.text, provider: 'gemini', model: result.model };
}

export { ollamaUnloadModel, pickBatchModel, resolveIntelRuntime };
