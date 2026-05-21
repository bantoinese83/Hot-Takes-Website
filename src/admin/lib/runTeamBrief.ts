import { loadIntelContext } from './intelContext';
import { INTEL_AGENTS, type IntelAgentId } from './intelAgents';
import { intelChat, ollamaUnloadModel, pickBatchModel } from './intelLlm';
import type { IntelProviderId } from './intelProvider';

const BATCH_AGENT_ORDER: IntelAgentId[] = [
  'queue-watcher',
  'moderation-analyst',
  'growth-scout',
  'geo-strategist',
  'community-editor',
  'ops-commander',
  'intel-director',
];

const BATCH_NUM_PREDICT = 900;
const PAUSE_BETWEEN_AGENTS_MS = 1500;

export type TeamBriefProgress = {
  phase: 'loading' | 'agent' | 'director' | 'done' | 'error' | 'cancelled';
  agentId?: IntelAgentId;
  message: string;
};

export async function runLightTeamBrief(params: {
  provider: IntelProviderId;
  ollamaModels: string[];
  signal?: AbortSignal;
  onProgress: (p: TeamBriefProgress) => void;
}): Promise<string> {
  const batchModel =
    params.provider === 'ollama' ? pickBatchModel(params.ollamaModels) : 'gemini-3.5-flash';

  params.onProgress({ phase: 'loading', message: 'Loading admin snapshot (once)…' });
  const sharedContext = await loadIntelContext('full');
  if (params.signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const sections: string[] = [];

  for (let i = 0; i < BATCH_AGENT_ORDER.length; i++) {
    const id = BATCH_AGENT_ORDER[i];
    const agent = INTEL_AGENTS.find((a) => a.id === id)!;
    const isDirector = id === 'intel-director';

    params.onProgress({
      phase: isDirector ? 'director' : 'agent',
      agentId: id,
      message: `${i + 1}/${BATCH_AGENT_ORDER.length} ${agent.codename} (${batchModel})…`,
    });

    if (params.signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const userContent = isDirector
      ? `SPECIALIST BRIEFS:\n${sections.join('\n\n---\n\n')}\n\nADMIN DATA:\n${sharedContext}\n\n${agent.starterPrompt}`
      : `ADMIN DATA:\n${sharedContext}\n\n${agent.starterPrompt}`;

    try {
      const { text } = await intelChat({
        provider: params.provider,
        ollamaModels: params.ollamaModels,
        ollamaModel: batchModel,
        messages: [
          { role: 'system', content: agent.systemPrompt },
          { role: 'user', content: userContent },
        ],
        signal: params.signal,
        keepAlive: params.provider === 'ollama' ? 0 : undefined,
        numPredict: isDirector ? 1200 : BATCH_NUM_PREDICT,
        geminiMaxTokens: isDirector ? 1200 : BATCH_NUM_PREDICT,
      });
      sections.push(`## ${agent.name} (${agent.codename})\n\n${text}`);
    } catch (e) {
      if (params.signal?.aborted) throw e;
      sections.push(`## ${agent.name}\n\nError: ${e instanceof Error ? e.message : 'failed'}`);
    }

    if (params.provider === 'ollama') {
      await ollamaUnloadModel(batchModel);
    }
    if (i < BATCH_AGENT_ORDER.length - 1) {
      await new Promise((r) => setTimeout(r, PAUSE_BETWEEN_AGENTS_MS));
    }
  }

  params.onProgress({ phase: 'done', message: 'Brief complete' });
  return sections.join('\n\n---\n\n');
}
