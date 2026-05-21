import { useCallback, useRef, useState } from 'react';
import { loadIntelContext } from '../lib/intelContext';
import { INTEL_AGENT_MAP, type IntelAgentId } from '../lib/intelAgents';
import { intelChat, type ChatMessage } from '../lib/intelLlm';
import type { IntelProviderId } from '../lib/intelProvider';
import { providerModelLabel } from '../lib/intelProvider';

export type IntelRunState = 'idle' | 'loading-data' | 'streaming' | 'done' | 'error';

export function useIntelAgent(
  agentId: IntelAgentId,
  runtime: {
    provider: IntelProviderId;
    ollamaModels: string[];
    geminiModel: string;
    canRun: boolean;
  },
) {
  const agent = INTEL_AGENT_MAP[agentId];
  const [state, setState] = useState<IntelRunState>('idle');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [contextPreview, setContextPreview] = useState<string | null>(null);
  const [lastModel, setLastModel] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const displayModel = providerModelLabel(runtime.provider, agent.model, runtime.geminiModel);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState('idle');
  }, []);

  const run = useCallback(
    async (userPrompt?: string) => {
      if (!runtime.canRun) {
        setError('No AI provider available. Use local Ollama (npm run dev) or configure GEMINI_API_KEY.');
        setState('error');
        return;
      }

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      setError(null);
      setOutput('');
      setState('loading-data');

      try {
        const contextJson = await loadIntelContext(agent.contextScope);
        if (ac.signal.aborted) return;
        setContextPreview(contextJson.slice(0, 800) + (contextJson.length > 800 ? '…' : ''));

        const messages: ChatMessage[] = [
          { role: 'system', content: agent.systemPrompt },
          {
            role: 'user',
            content: `ADMIN DATA (JSON):\n${contextJson}\n\nTASK:\n${userPrompt?.trim() || agent.starterPrompt}`,
          },
        ];

        setState('streaming');
        const result = await intelChat({
          provider: runtime.provider,
          ollamaModels: runtime.ollamaModels,
          ollamaModel: agent.model,
          messages,
          signal: ac.signal,
          onToken: (chunk) => setOutput((prev) => prev + chunk),
          numPredict: 2048,
        });
        setLastModel(result.model);
        if (!ac.signal.aborted) setState('done');
      } catch (e) {
        if (ac.signal.aborted) return;
        setError(e instanceof Error ? e.message : 'Intel run failed');
        setState('error');
      } finally {
        abortRef.current = null;
      }
    },
    [agent, runtime],
  );

  return { agent, state, output, error, contextPreview, displayModel, lastModel, run, cancel };
}
