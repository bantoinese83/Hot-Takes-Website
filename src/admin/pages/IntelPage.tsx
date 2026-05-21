import { useCallback, useEffect, useState } from 'react';
import { Brain, Play, Square, Zap } from 'lucide-react';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { loadIntelContext } from '../lib/intelContext';
import { INTEL_AGENTS, type IntelAgentId } from '../lib/intelAgents';
import { useIntelAgent } from '../hooks/useIntelAgent';
import { ollamaChat, ollamaHealth, pickModel, type OllamaModel } from '../lib/ollamaClient';
import '../admin.css';

function formatModelSize(bytes?: number): string {
  if (!bytes) return '';
  const gb = bytes / 1e9;
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / 1e6).toFixed(0)} MB`;
}

function AgentPanel({
  agentId,
  availableModels,
  selected,
  onSelect,
}: {
  agentId: IntelAgentId;
  availableModels: string[];
  selected: boolean;
  onSelect: () => void;
}) {
  const { agent, state, output, error, contextPreview, run, cancel } = useIntelAgent(
    agentId,
    availableModels,
  );
  const [followUp, setFollowUp] = useState('');
  const Icon = agent.icon;
  const busy = state === 'loading-data' || state === 'streaming';

  return (
    <article className={`intel-agent-card ${selected ? 'intel-agent-card--active' : ''}`}>
      <button type="button" className="intel-agent-card-head" onClick={onSelect}>
        <span className="intel-agent-icon">
          <Icon size={18} aria-hidden />
        </span>
        <span className="intel-agent-meta">
          <span className="intel-agent-codename">{agent.codename}</span>
          <span className="intel-agent-name">{agent.name}</span>
          <span className="intel-agent-role">{agent.role}</span>
        </span>
        <span className="intel-agent-model">{agent.model}</span>
      </button>

      {selected ? (
        <div className="intel-agent-body">
          <div className="intel-agent-actions">
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              disabled={busy || !availableModels.length}
              onClick={() => void run()}
            >
              <Play size={14} aria-hidden /> Run brief
            </button>
            {busy ? (
              <button type="button" className="admin-btn admin-btn--ghost" onClick={cancel}>
                <Square size={14} aria-hidden /> Stop
              </button>
            ) : null}
          </div>

          <label className="intel-followup-label">
            Follow-up
            <textarea
              className="intel-followup-input"
              rows={2}
              placeholder="Ask a specific question…"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              disabled={busy}
            />
          </label>
          {followUp.trim() ? (
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              disabled={busy}
              onClick={() => void run(followUp)}
            >
              Send follow-up
            </button>
          ) : null}

          {contextPreview && state !== 'idle' ? (
            <details className="intel-context-details">
              <summary>Data fed to model</summary>
              <pre>{contextPreview}</pre>
            </details>
          ) : null}

          {error ? <p className="intel-agent-error">{error}</p> : null}

          {output ? (
            <div className="intel-output" aria-live="polite">
              <pre>{output}</pre>
              {state === 'streaming' ? <span className="intel-cursor" aria-hidden /> : null}
            </div>
          ) : state === 'loading-data' ? (
            <p className="admin-loading">Loading Supabase admin data…</p>
          ) : state === 'streaming' && !output ? (
            <p className="admin-loading">Thinking…</p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function IntelPage() {
  const [health, setHealth] = useState<{ ok: boolean; models: OllamaModel[]; error?: string }>({
    ok: false,
    models: [],
  });
  const [selectedId, setSelectedId] = useState<IntelAgentId>('intel-director');
  const [briefRunning, setBriefRunning] = useState(false);
  const [briefLog, setBriefLog] = useState<string[]>([]);
  const [fullBrief, setFullBrief] = useState<string | null>(() =>
    typeof localStorage !== 'undefined' ? localStorage.getItem('ht_intel_last_brief') : null,
  );

  const refreshHealth = useCallback(async () => {
    setHealth(await ollamaHealth());
  }, []);

  useEffect(() => {
    void refreshHealth();
    const id = window.setInterval(() => void refreshHealth(), 20_000);
    return () => window.clearInterval(id);
  }, [refreshHealth]);

  const modelNames = health.models.map((m) => m.name);

  const runFullBrief = async () => {
    if (!modelNames.length) return;
    setBriefRunning(true);
    setBriefLog([]);
    const order: IntelAgentId[] = [
      'ops-commander',
      'queue-watcher',
      'moderation-analyst',
      'growth-scout',
      'geo-strategist',
      'community-editor',
      'intel-director',
    ];
    const sections: string[] = [];

    for (const id of order) {
      const agent = INTEL_AGENTS.find((a) => a.id === id)!;
      setBriefLog((prev) => [...prev, `Running ${agent.codename}…`]);
      try {
        const ctx = await loadIntelContext(agent.contextScope);
        const text = await ollamaChat({
          model: pickModel(agent.model, modelNames),
          messages: [
            { role: 'system', content: agent.systemPrompt },
            { role: 'user', content: `ADMIN DATA:\n${ctx}\n\n${agent.starterPrompt}` },
          ],
        });
        sections.push(`## ${agent.name} (${agent.codename})\n\n${text}`);
      } catch (e) {
        sections.push(`## ${agent.name}\n\nError: ${e instanceof Error ? e.message : 'failed'}`);
      }
    }

    setBriefLog([]);
    const combined = sections.join('\n\n---\n\n');
    setFullBrief(combined);
    localStorage.setItem('ht_intel_last_brief', combined);
    setSelectedId('intel-director');
    setBriefRunning(false);
  };

  return (
    <AdminPageShell
      title="Intel team"
      subtitle="Local Ollama agents on your Mac — analyze live Supabase ops data"
      actions={
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          disabled={!health.ok || briefRunning}
          onClick={() => void runFullBrief()}
        >
          <Zap size={14} aria-hidden /> Run all agents
        </button>
      }
    >
      <div className={`intel-status ${health.ok ? 'intel-status--ok' : 'intel-status--err'}`}>
        <Brain size={20} aria-hidden />
        <div>
          <strong>{health.ok ? 'Ollama connected' : 'Ollama offline'}</strong>
          <p>
            {health.ok
              ? `${health.models.length} model(s) — scout llama3.2:3b · workhorse llama3.1:8b · analyst qwen2.5:14b`
              : health.error ?? 'Start Ollama app, then run ./scripts/ollama-setup.sh'}
          </p>
        </div>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={() => void refreshHealth()}>
          Refresh
        </button>
      </div>

      {!health.ok ? (
        <AdminErrorBanner
          message="Intel requires Ollama on this machine. Vite proxies /ollama → localhost:11434 during npm run dev."
          degraded
        />
      ) : null}

      {health.models.length > 0 ? (
        <ul className="intel-model-list">
          {health.models.map((m) => (
            <li key={m.name}>
              <code>{m.name}</code>
              {m.size ? <span>{formatModelSize(m.size)}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {briefRunning && briefLog.length ? (
        <p className="admin-hint-card">{briefLog[briefLog.length - 1]}</p>
      ) : null}

      {fullBrief ? (
        <details className="intel-full-brief" open={briefRunning}>
          <summary>Last full-team brief</summary>
          <pre>{fullBrief}</pre>
        </details>
      ) : null}

      <div className="intel-agent-grid">
        {INTEL_AGENTS.map((a) => (
          <AgentPanel
            key={a.id}
            agentId={a.id}
            availableModels={modelNames}
            selected={selectedId === a.id}
            onSelect={() => setSelectedId(a.id)}
          />
        ))}
      </div>
    </AdminPageShell>
  );
}
