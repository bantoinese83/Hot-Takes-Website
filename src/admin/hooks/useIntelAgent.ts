import { useCallback, useRef, useState } from 'react';
import { loadIntelContext } from '../lib/intelContext';
import { INTEL_AGENT_MAP, type IntelAgentId } from '../lib/intelAgents';
import { ollamaChat, pickModel, type ChatMessage } from '../lib/ollamaClient';

export type IntelRunState = 'idle' | 'loading-data' | 'streaming' | 'done' | 'error';

export function useIntelAgent(agentId: IntelAgentId, availableModels: string[]) {
  const agent = INTEL_AGENT_MAP[agentId];
  const [state, setState] = useState<IntelRunState>('idle');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [contextPreview, setContextPreview] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState('idle');
  }, []);

  const run = useCallback(
    async (userPrompt?: string) => {
      if (!availableModels.length) {
        setError('No Ollama models installed. Run: ./scripts/ollama-setup.sh');
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

        const model = pickModel(agent.model, availableModels);
        const messages: ChatMessage[] = [
          { role: 'system', content: agent.systemPrompt },
          {
            role: 'user',
            content: `ADMIN DATA (JSON):\n${contextJson}\n\nTASK:\n${userPrompt?.trim() || agent.starterPrompt}`,
          },
        ];

        setState('streaming');
        await ollamaChat({
          model,
          messages,
          signal: ac.signal,
          onToken: (chunk) => setOutput((prev) => prev + chunk),
        });
        if (!ac.signal.aborted) setState('done');
      } catch (e) {
        if (ac.signal.aborted) return;
        setError(e instanceof Error ? e.message : 'Intel run failed');
        setState('error');
      } finally {
        abortRef.current = null;
      }
    },
    [agent, availableModels],
  );

  return { agent, state, output, error, contextPreview, run, cancel };
}
