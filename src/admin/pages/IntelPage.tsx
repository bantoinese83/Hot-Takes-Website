import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Brain,
  ChevronRight,
  Cloud,
  HardDrive,
  Loader2,
  Play,
  Sparkles,
  Square,
  Zap,
} from 'lucide-react';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { IntelMarkdown } from '../components/IntelMarkdown';
import {
  INTEL_AGENTS,
  INTEL_AGENT_MAP,
  type IntelAgentDef,
  type IntelAgentId,
} from '../lib/intelAgents';
import { useIntelAgent, type IntelRunState } from '../hooks/useIntelAgent';
import { runLightTeamBrief } from '../lib/runTeamBrief';
import { resolveIntelRuntime, type IntelRuntime } from '../lib/intelProvider';
import { pickBatchModel } from '../lib/intelLlm';
import { ollamaHealth, type OllamaModel } from '../lib/ollamaClient';
import '../admin.css';

const DIRECTOR_ID: IntelAgentId = 'intel-director';
const SPECIALISTS = INTEL_AGENTS.filter((a) => a.id !== DIRECTOR_ID);
const DIRECTOR = INTEL_AGENT_MAP[DIRECTOR_ID];

function formatModelSize(bytes?: number): string {
  if (!bytes) return '';
  const gb = bytes / 1e9;
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / 1e6).toFixed(0)} MB`;
}

function stateLabel(state: IntelRunState): string | null {
  if (state === 'loading-data') return 'Loading data';
  if (state === 'streaming') return 'Thinking';
  if (state === 'done') return 'Ready';
  if (state === 'error') return 'Error';
  return null;
}

function AgentRosterButton({
  agent,
  selected,
  displayModel,
  runState,
  onSelect,
}: {
  agent: IntelAgentDef;
  selected: boolean;
  displayModel: string;
  runState: IntelRunState;
  onSelect: () => void;
}) {
  const Icon = agent.icon;
  const busy = runState === 'loading-data' || runState === 'streaming';
  const status = stateLabel(runState);

  return (
    <button
      type="button"
      className={`intel-roster-item${selected ? ' intel-roster-item--active' : ''}${
        agent.id === DIRECTOR_ID ? ' intel-roster-item--director' : ''
      }`}
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
    >
      <span className="intel-roster-icon">
        <Icon size={17} aria-hidden />
      </span>
      <span className="intel-roster-copy">
        <span className="intel-roster-codename">{agent.codename}</span>
        <span className="intel-roster-name">{agent.name}</span>
      </span>
      <span className="intel-roster-tail">
        {busy ? (
          <Loader2 size={14} className="intel-roster-spin" aria-hidden />
        ) : status && selected ? (
          <span className={`intel-roster-pill intel-roster-pill--${runState}`}>{status}</span>
        ) : (
          <ChevronRight size={14} className="intel-roster-chevron" aria-hidden />
        )}
      </span>
      <span className="intel-roster-model" title={displayModel}>
        {displayModel}
      </span>
    </button>
  );
}

function AgentWorkspace({
  agentId,
  runtime,
  onStateChange,
}: {
  agentId: IntelAgentId;
  runtime: IntelRuntime;
  onStateChange?: (state: IntelRunState) => void;
}) {
  const agent = INTEL_AGENT_MAP[agentId];
  const { state, output, error, contextPreview, displayModel, run, cancel } = useIntelAgent(
    agentId,
    runtime,
  );
  const [followUp, setFollowUp] = useState('');

  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);
  const Icon = agent.icon;
  const busy = state === 'loading-data' || state === 'streaming';
  const status = stateLabel(state);

  return (
    <section className="intel-stage" aria-labelledby="intel-stage-title">
      <header className="intel-stage-header">
        <div className="intel-stage-identity">
          <span className="intel-stage-icon">
            <Icon size={22} aria-hidden />
          </span>
          <div>
            <p className="intel-stage-codename">{agent.codename}</p>
            <h2 id="intel-stage-title" className="intel-stage-title">
              {agent.name}
            </h2>
            <p className="intel-stage-role">{agent.role}</p>
          </div>
        </div>
        <div className="intel-stage-badges">
          <span className="intel-chip">
            <code>{displayModel}</code>
          </span>
          {status ? (
            <span className={`intel-chip intel-chip--status intel-chip--${state}`}>{status}</span>
          ) : null}
        </div>
      </header>

      <div className="intel-stage-toolbar">
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          disabled={busy || !runtime.canRun}
          onClick={() => void run()}
        >
          <Play size={15} aria-hidden />
          Run brief
        </button>
        {busy ? (
          <button type="button" className="admin-btn admin-btn--ghost" onClick={cancel}>
            <Square size={15} aria-hidden />
            Stop
          </button>
        ) : null}
      </div>

      <div className="intel-composer">
        <label className="intel-composer-label" htmlFor="intel-followup">
          Follow-up question
        </label>
        <div className="intel-composer-row">
          <textarea
            id="intel-followup"
            className="intel-composer-input"
            rows={2}
            placeholder="Ask something specific about this dataset…"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            disabled={busy}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && followUp.trim()) {
                e.preventDefault();
                void run(followUp);
              }
            }}
          />
          <button
            type="button"
            className="admin-btn admin-btn--secondary intel-composer-send"
            disabled={busy || !runtime.canRun || !followUp.trim()}
            onClick={() => void run(followUp)}
          >
            Send
          </button>
        </div>
        <p className="intel-composer-hint">⌘↵ to send · Uses live Supabase admin snapshot</p>
      </div>

      {contextPreview && state !== 'idle' ? (
        <details className="intel-context-details">
          <summary>Data fed to model</summary>
          <pre>{contextPreview}</pre>
        </details>
      ) : null}

      {error ? <p className="intel-agent-error">{error}</p> : null}

      <div className="intel-stage-output-wrap">
        {output ? (
          <div className="intel-output intel-output--stage" aria-live="polite">
            <IntelMarkdown content={output} />
            {state === 'streaming' ? <span className="intel-cursor" aria-hidden /> : null}
          </div>
        ) : busy ? (
          <div className="intel-output-placeholder" aria-busy="true">
            <Loader2 size={28} className="intel-roster-spin" aria-hidden />
            <p>{state === 'loading-data' ? 'Pulling admin metrics…' : 'Drafting brief…'}</p>
          </div>
        ) : (
          <div className="intel-output-placeholder">
            <Sparkles size={28} aria-hidden className="intel-placeholder-icon" />
            <p className="intel-placeholder-title">No brief yet</p>
            <p className="intel-placeholder-sub">{agent.starterPrompt}</p>
          </div>
        )}
      </div>
    </section>
  );
}

export function IntelPage() {
  const [runtime, setRuntime] = useState<IntelRuntime | null>(null);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [loadingRuntime, setLoadingRuntime] = useState(true);
  const [selectedId, setSelectedId] = useState<IntelAgentId>(DIRECTOR_ID);
  const [briefRunning, setBriefRunning] = useState(false);
  const [briefLog, setBriefLog] = useState<string[]>([]);
  const [briefOpen, setBriefOpen] = useState(true);
  const [fullBrief, setFullBrief] = useState<string | null>(() =>
    typeof localStorage !== 'undefined' ? localStorage.getItem('ht_intel_last_brief') : null,
  );
  const [activeRunState, setActiveRunState] = useState<IntelRunState>('idle');
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
    setBriefOpen(true);
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
      setSelectedId(DIRECTOR_ID);
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
  const directorModel = useMemo(
    () =>
      runtime
        ? runtime.provider === 'gemini'
          ? runtime.geminiModel
          : DIRECTOR.model
        : '—',
    [runtime],
  );

  return (
    <AdminPageShell
      title="Intel team"
      subtitle="Multi-agent ops briefs · local Ollama in dev · Gemini on production"
      actions={
        <div className="intel-page-actions">
          <button
            type="button"
            className="admin-btn admin-btn--primary intel-btn-brief"
            disabled={!runtime?.canRun || briefRunning || loadingRuntime}
            onClick={() => void runFullBrief()}
          >
            <Zap size={15} aria-hidden />
            Run team brief
          </button>
          {briefRunning ? (
            <button type="button" className="admin-btn admin-btn--ghost" onClick={cancelBrief}>
              <Square size={15} aria-hidden />
              Stop
            </button>
          ) : null}
        </div>
      }
    >
      <div
        className={`intel-hero${runtime?.canRun ? ' intel-hero--live' : ' intel-hero--offline'}`}
      >
        <div className="intel-hero-glow" aria-hidden />
        <div className="intel-hero-main">
          <div className="intel-hero-icon">
            {runtime ? <ProviderIcon size={22} aria-hidden /> : <Brain size={22} aria-hidden />}
          </div>
          <div className="intel-hero-copy">
            <p className="intel-hero-label">Inference provider</p>
            <strong>
              {loadingRuntime
                ? 'Checking providers…'
                : runtime?.canRun
                  ? runtime.label
                  : 'No provider available'}
            </strong>
            <p>{runtime?.detail ?? 'Start Ollama locally or set GEMINI_API_KEY on Supabase.'}</p>
          </div>
        </div>
        <div className="intel-hero-chips">
          {runtime?.provider === 'gemini' && runtime.geminiConfigured ? (
            <span className="intel-chip">
              <Cloud size={12} aria-hidden />
              <code>{runtime.geminiModel}</code>
            </span>
          ) : null}
          {runtime?.provider === 'ollama' ? (
            <span className="intel-chip">
              <HardDrive size={12} aria-hidden />
              Team brief · <code>llama3.2:3b</code>
            </span>
          ) : null}
          <span className="intel-chip intel-chip--muted">{INTEL_AGENTS.length} agents</span>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--ghost intel-hero-refresh"
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
        <ul className="intel-model-strip">
          {ollamaModels.map((m) => (
            <li key={m.name}>
              <code>{m.name}</code>
              {m.size ? <span>{formatModelSize(m.size)}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {briefRunning && briefLog.length ? (
        <div className="intel-brief-progress" role="status">
          <Loader2 size={16} className="intel-roster-spin" aria-hidden />
          <span>{briefLog[briefLog.length - 1]}</span>
        </div>
      ) : null}

      {fullBrief ? (
        <details
          className="intel-full-brief"
          open={briefOpen}
          onToggle={(e) => setBriefOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary>
            <span className="intel-full-brief-title">
              <Sparkles size={16} aria-hidden />
              Last executive brief
            </span>
            <span className="intel-full-brief-meta">Director synthesis</span>
          </summary>
          <div className="intel-full-brief-body">
            <IntelMarkdown content={fullBrief} />
          </div>
        </details>
      ) : null}

      {runtime ? (
        <div className="intel-workspace">
          <aside className="intel-roster" aria-label="Intel agents">
            <p className="intel-roster-heading">Orchestrator</p>
            <AgentRosterButton
              agent={DIRECTOR}
              selected={selectedId === DIRECTOR_ID}
              displayModel={directorModel}
              runState={selectedId === DIRECTOR_ID ? activeRunState : 'idle'}
              onSelect={() => setSelectedId(DIRECTOR_ID)}
            />
            <p className="intel-roster-heading">Specialists</p>
            <nav className="intel-roster-list">
              {SPECIALISTS.map((a) => (
                <AgentRosterButton
                  key={a.id}
                  agent={a}
                  selected={selectedId === a.id}
                  displayModel={
                    runtime.provider === 'gemini' ? runtime.geminiModel : a.model
                  }
                  runState={selectedId === a.id ? activeRunState : 'idle'}
                  onSelect={() => setSelectedId(a.id)}
                />
              ))}
            </nav>
            <p className="intel-roster-foot">
              {runtime.provider === 'ollama'
                ? 'Production admin uses Gemini automatically.'
                : 'Gemini via admin-intel edge function.'}
            </p>
          </aside>
          <AgentWorkspace
            key={selectedId}
            agentId={selectedId}
            runtime={runtime}
            onStateChange={setActiveRunState}
          />
        </div>
      ) : null}
    </AdminPageShell>
  );
}
