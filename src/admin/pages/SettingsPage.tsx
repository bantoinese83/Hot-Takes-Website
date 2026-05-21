import { useCallback, useEffect, useState } from 'react';
import { Save, RefreshCw, AlertCircle, Settings, Brain, Sparkles, X, Loader2 } from 'lucide-react';
import { AdminPageShell } from '../components/AdminPageShell';
import { AdminRefreshButton } from '../components/AdminRefreshButton';
import { AdminErrorBanner } from '../components/AdminErrorBanner';
import { AdminSuccessBanner } from '../components/AdminSuccessBanner';
import { IntelMarkdown } from '../components/IntelMarkdown';
import { fetchPairingWeights, updatePairingWeight, type PairingWeight } from '../../lib/adminApi';
import { resolveIntelRuntime, type IntelRuntime } from '../lib/intelProvider';
import { loadIntelContext } from '../lib/intelContext';
import { intelChat } from '../lib/intelLlm';
import { INTEL_AGENT_MAP } from '../lib/intelAgents';

export function SettingsPage() {
  const [weights, setWeights] = useState<PairingWeight[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKeys, setBusyKeys] = useState<Set<string>>(new Set());

  // Intel State
  const [intelRuntime, setIntelRuntime] = useState<IntelRuntime | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState('');
  const [showAi, setShowAi] = useState(false);

  useEffect(() => {
    void resolveIntelRuntime().then(setIntelRuntime);
  }, []);

  const runAiTuning = async () => {
    setAiLoading(true);
    setAiOutput('');
    setShowAi(true);
    
    try {
      const agent = INTEL_AGENT_MAP['algorithm-tuner'];
      const context = await loadIntelContext(agent.contextScope);
      
      await intelChat({
        provider: intelRuntime?.provider ?? 'ollama',
        ollamaModels: intelRuntime?.ollamaModels ?? [],
        ollamaModel: agent.model,
        messages: [
          { role: 'system', content: agent.systemPrompt },
          { role: 'user', content: `SYSTEM DATA (JSON):\n${context}\n\n${agent.starterPrompt}` }
        ],
        onToken: (t) => setAiOutput(prev => prev + t),
      });
    } catch (err) {
      setAiOutput('AI analysis failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAiLoading(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPairingWeights();
      setWeights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onUpdateWeight = async (key: string, value: number) => {
    setBusyKeys((prev) => new Set(prev).add(key));
    try {
      await updatePairingWeight(key, value);
      setSuccess(`Updated ${key} successfully.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusyKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  return (
    <AdminPageShell
      title="System Settings"
      subtitle="Configure global pairing weights and app behavior"
      actions={
        <div className="admin-action-row">
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            style={{ borderColor: 'rgba(255, 84, 78, 0.4)' }}
            disabled={!intelRuntime?.canRun || loading || aiLoading}
            onClick={() => void runAiTuning()}
          >
            {aiLoading ? (
              <Loader2 size={15} className="admin-spin" />
            ) : (
              <Brain size={15} style={{ color: 'var(--color-accent)' }} />
            )}
            Analyze & suggest
          </button>
          <AdminRefreshButton onClick={() => void load()} loading={loading} />
        </div>
      }
    >
      {error ? <AdminErrorBanner message={error} /> : null}
      {success ? <AdminSuccessBanner message={success} onDismiss={() => setSuccess(null)} /> : null}

      {showAi && (
        <div className="admin-panel intel-output" style={{ marginBottom: '1.5rem', borderColor: 'rgba(255, 84, 78, 0.3)' }}>
          <div className="admin-panel-header" style={{ borderBottomColor: 'rgba(255, 84, 78, 0.15)' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} style={{ color: 'var(--color-accent)' }} />
              Intel tuning suggestions
            </h2>
            <button type="button" className="admin-btn admin-btn--ghost admin-btn--compact" onClick={() => setShowAi(false)}>
              <X size={14} />
            </button>
          </div>
          <div className="intel-markdown" style={{ padding: '1rem' }}>
            {aiOutput ? (
              <IntelMarkdown content={aiOutput} />
            ) : (
              <div className="admin-loading" style={{ padding: '1rem' }}>
                <Loader2 size={24} className="admin-spin" style={{ margin: '0 auto 0.5rem' }} />
                <p>Consulting Algorithm Tuner…</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="admin-panel">
        <div className="admin-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Settings size={18} style={{ color: 'var(--color-secondary)' }} />
            <h2>Pairing Algorithm Weights</h2>
          </div>
          <span className="admin-panel-meta">Directly affects ranking scores</span>
        </div>
        
        <div className="admin-hint-card" style={{ margin: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              <strong>Caution:</strong> Changes to these weights take effect immediately for all live pairings. 
              Lower ranking scores indicate a stronger match. "Bonus" values (positive) are subtracted from the score, 
              while "Penalty" values are added.
            </p>
          </div>
        </div>

        {loading && weights.length === 0 ? (
          <p className="admin-loading">Loading weights…</p>
        ) : (
            <div className="admin-weight-list">
              {/* Group: Core Logic */}
              <div className="admin-section-header" style={{ padding: '1rem 1.25rem 0.5rem', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Core Algorithm</h3>
              </div>
              {weights.filter(w => ['ideal_mid_distance', 'goldilocks_nudge_weight'].includes(w.key)).map((w) => (
                <WeightRow key={w.key} weight={w} isBusy={busyKeys.has(w.key)} onUpdate={onUpdateWeight} />
              ))}

              {/* Group: Bonuses */}
              <div className="admin-section-header" style={{ padding: '1rem 1.25rem 0.5rem', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Priority Bonuses</h3>
              </div>
              {weights.filter(w => w.key.includes('bonus') || w.key.includes('alignment')).map((w) => (
                <WeightRow key={w.key} weight={w} isBusy={busyKeys.has(w.key)} onUpdate={onUpdateWeight} />
              ))}

              {/* Group: Penalties */}
              <div className="admin-section-header" style={{ padding: '1rem 1.25rem 0.5rem', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Age & Staleness Penalties</h3>
              </div>
              {weights.filter(w => w.key.includes('penalty')).map((w) => (
                <WeightRow key={w.key} weight={w} isBusy={busyKeys.has(w.key)} onUpdate={onUpdateWeight} />
              ))}
            </div>
        )}
      </div>

      <div className="admin-panel" style={{ marginTop: '1.5rem' }}>
        <div className="admin-panel-header">
          <h2>About the Algorithm</h2>
        </div>
        <div style={{ padding: '1rem', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
          <p>
            The pairing engine uses a multi-factor ranking system. It calculates a score between 0 and 2.0+ for every 
            compatible pair in the queue. 
          </p>
          <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
            <li><strong>Embedding Term:</strong> Base similarity between Hot Takes (cosine distance).</li>
            <li><strong>Wait Bonus:</strong> Encourages matching users who have been waiting longer.</li>
            <li><strong>Age Penalty:</strong> Slightly penalizes large age gaps between users.</li>
            <li><strong>Alignment Bonuses:</strong> Intent, Politics, and Religion matches provide fixed score reductions.</li>
            <li><strong>Staleness:</strong> Users with older Hot Takes (90d+) receive a slight penalty.</li>
          </ul>
        </div>
      </div>
    </AdminPageShell>
  );
}

function WeightRow({ 
  weight, 
  isBusy, 
  onUpdate 
}: { 
  weight: PairingWeight; 
  isBusy: boolean; 
  onUpdate: (key: string, val: number) => Promise<void> 
}) {
  const [localVal, setLocalVal] = useState(weight.value);

  // Sync if weight prop changes from outside (e.g. after refresh)
  useEffect(() => {
    setLocalVal(weight.value);
  }, [weight.value]);

  const isPenalty = weight.key.includes('penalty');
  const isBonus = weight.key.includes('bonus') || weight.key.includes('alignment');
  
  // Determine range and step based on the weight type
  let min = 0;
  let max = 0.5;
  let step = 0.001;

  if (weight.key.includes('seconds')) {
    min = 60;
    max = 1200;
    step = 10;
  } else if (weight.key.includes('distance') || weight.key.includes('nudge')) {
    min = 0.1;
    max = 1.0;
    step = 0.01;
  } else if (weight.key.includes('max_age_penalty')) {
    min = 0.05;
    max = 0.5;
    step = 0.01;
  } else if (isBonus || isPenalty) {
    min = 0;
    max = 0.4;
    step = 0.001;
  }

  const color = isPenalty ? '#f87171' : (isBonus ? '#4ade80' : 'var(--color-secondary)');

  return (
    <div className="admin-weight-row">
      <div className="admin-weight-info">
        <h4>{weight.key.replace(/_/g, ' ')}</h4>
        <p>{weight.description}</p>
      </div>
      <div className="admin-slider-wrap">
        <div className="admin-slider-val" style={{ color }}>
          {weight.key.includes('seconds') ? Math.round(localVal) : localVal.toFixed(step < 0.01 ? 3 : 2)}
          {weight.key.includes('seconds') && <span style={{ fontSize: '0.7rem', marginLeft: '0.2rem', opacity: 0.7 }}>s</span>}
        </div>
        <input
          type="range"
          className="admin-range"
          min={min}
          max={max}
          step={step}
          value={localVal}
          onChange={(e) => setLocalVal(parseFloat(e.target.value))}
          onMouseUp={() => {
            if (localVal !== weight.value) {
              void onUpdate(weight.key, localVal);
            }
          }}
          onTouchEnd={() => {
            if (localVal !== weight.value) {
              void onUpdate(weight.key, localVal);
            }
          }}
          disabled={isBusy}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {isBusy ? (
          <RefreshCw size={16} className="admin-spin" style={{ color: 'var(--color-secondary)' }} />
        ) : (
          <Save size={16} style={{ color: 'var(--text-muted)', opacity: 0.2 }} />
        )}
      </div>
    </div>
  );
}
