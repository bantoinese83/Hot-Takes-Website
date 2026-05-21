import { useCallback, useEffect, useRef, useState } from 'react';
import { Brain, Cloud, HardDrive, Play, Square, Zap } from 'lucide-react';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { INTEL_AGENTS, type IntelAgentId } from '../lib/intelAgents';
import { useIntelAgent } from '../hooks/useIntelAgent';
import { runLightTeamBrief } from '../lib/runTeamBrief';
import { resolveIntelRuntime, type IntelRuntime } from '../lib/intelProvider';
import { pickBatchModel } from '../lib/intelLlm';
import { ollamaHealth, type OllamaModel } from '../lib/ollamaClient';
import '../admin.css';

function formatModelSize(bytes?: number): string {
  if (!bytes) return '';
  const gb = bytes / 1e9;
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / 1e6).toFixed(0)} MB`;
}

function AgentPanel({
  agentId,
  runtime,
  selected,
  onSelect,
}: {
  agentId: IntelAgentId;
  runtime: IntelRuntime;
  selected: boolean;
  onSelect: () => void;
}) {
  const { agent, state, output, error, contextPreview, displayModel, run, cancel } = useIntelAgent(
    agentId,
    runtime,
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
        <span className="intel-agent-model">{displayModel}</span>
      </button>

      {selected ? (
        <div className="intel-agent-body">
          <div className="intel-agent-actions">
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              disabled={busy || !runtime.canRun}
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
              disabled={busy || !runtime.canRun}
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
  const [runtime, setRuntime] = useState<IntelRuntime | null>(null);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [loadingRuntime, setLoadingRuntime] = useState(true);
  const [selectedId, setSelectedId] = useState<IntelAgentId>('intel-director');
  const [briefRunning, setBriefRunning] = useState(false);
  const [briefLog, setBriefLog] = useState<string[]>([]);
  const [fullBrief, setFullBrief] = useState<string | null>(() =>
    typeof localStorage !== 'undefined' ? localStorage.getItem('ht_intel_last_brief') : null,
  );
  const briefAbortRef = useRef<AbortController | null>(null);

  const refreshRuntime = useCallback(async () => {
    setLoadingRuntime(true);
    const [resolved, ollama] = await Promise.all([resolveIntelRuntime(), ollamaHealth()]);
    setRuntime(resolved);
    setOllamaModels(ollama.models);
    setLoadingRuntime(false);
  }, []);

  useEffect(() => {
    void refreshRuntime();
    const id = window.setInterval(() => void refreshRuntime(), 30_000);
    return () => window.clearInterval(id);
  }, [refreshRuntime]);

  const cancelBrief = () => {
    briefAbortRef.current?.abort();
    briefAbortRef.current = null;
    setBriefRunning(false);
    setBriefLog(['Cancelled']);
  };

  const runFullBrief = async () => {
    if (!runtime?.canRun) return;
    briefAbortRef.current?.abort();
    const ac = new AbortController();
    briefAbortRef.current = ac;

    const modelLabel =
      runtime.provider === 'ollama'
        ? pickBatchModel(runtime.ollamaModels)
        : runtime.geminiModel;

    setBriefRunning(true);
    setBriefLog([`Team brief · ${runtime.label} · ${modelLabel}`]);

    try {
      const combined = await runLightTeamBrief({
        provider: runtime.provider,
        ollamaModels: runtime.ollamaModels,
        signal: ac.signal,
        onProgress: (p) => setBriefLog([p.message]),
      });
      setFullBrief(combined);
      localStorage.setItem('ht_intel_last_brief', combined);
      setSelectedId('intel-director');
      setBriefLog([]);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setBriefLog([e instanceof Error ? e.message : 'Brief failed']);
    } finally {
      briefAbortRef.current = null;
      setBriefRunning(false);
    }
  };

  const ProviderIcon = runtime?.provider === 'ollama' ? HardDrive : Cloud;

  return (
    <AdminPageShell
      title="Intel team"
      subtitle="Ollama on your Mac when developing · Gemini 3.5 Flash on the live admin"
      actions={
        <div className="intel-page-actions">
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            disabled={!runtime?.canRun || briefRunning || loadingRuntime}
            onClick={() => void runFullBrief()}
          >
            <Zap size={14} aria-hidden /> Run team brief
          </button>
          {briefRunning ? (
            <button type="button" className="admin-btn admin-btn--ghost" onClick={cancelBrief}>
              <Square size={14} aria-hidden /> Stop
            </button>
          ) : null}
        </div>
      }
    >
      <div
        className={`intel-status ${runtime?.canRun ? 'intel-status--ok' : 'intel-status--err'}`}
      >
        {runtime ? <ProviderIcon size={20} aria-hidden /> : <Brain size={20} aria-hidden />}
        <div>
          <strong>
            {loadingRuntime
              ? 'Checking providers…'
              : runtime?.canRun
                ? `Active: ${runtime.label}`
                : 'No provider available'}
          </strong>
          <p>{runtime?.detail ?? 'Connect Ollama locally or set GEMINI_API_KEY on Supabase.'}</p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={() => void refreshRuntime()}
          disabled={loadingRuntime}
        >
          Refresh
        </button>
      </div>

      {!loadingRuntime && runtime && !runtime.canRun ? (
        <AdminErrorBanner message={runtime.detail} degraded />
      ) : null}

      {runtime?.provider === 'ollama' && ollamaModels.length > 0 ? (
        <ul className="intel-model-list">
          {ollamaModels.map((m) => (
            <li key={m.name}>
              <code>{m.name}</code>
              {m.size ? <span>{formatModelSize(m.size)}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {runtime?.provider === 'gemini' && runtime.geminiConfigured ? (
        <p className="admin-hint-card">
          Cloud model: <code>{runtime.geminiModel}</code> · generateContent · thinking{' '}
          <code>low</code> (cost-efficient). Override via Supabase secret{' '}
          <code>GEMINI_INTEL_MODEL</code> (e.g. <code>gemini-2.5-flash-lite</code>).
        </p>
      ) : null}

      {runtime?.provider === 'ollama' ? (
        <p className="admin-hint-card intel-memory-hint" role="note">
          <strong>Memory:</strong> Team brief uses only <code>llama3.2:3b</code>. On production URL we
          automatically use Gemini instead.
        </p>
      ) : null}

      {briefRunning && briefLog.length ? (
        <p className="admin-hint-card intel-brief-progress">{briefLog[briefLog.length - 1]}</p>
      ) : null}

      {fullBrief ? (
        <details className="intel-full-brief" open={briefRunning}>
          <summary>Last full-team brief</summary>
          <pre>{fullBrief}</pre>
        </details>
      ) : null}

      {runtime ? (
        <div className="intel-agent-grid">
          {INTEL_AGENTS.map((a) => (
            <AgentPanel
              key={a.id}
              agentId={a.id}
              runtime={runtime}
              selected={selectedId === a.id}
              onSelect={() => setSelectedId(a.id)}
            />
          ))}
        </div>
      ) : null}
    </AdminPageShell>
  );
}
