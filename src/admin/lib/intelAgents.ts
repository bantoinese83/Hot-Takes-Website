import type { LucideIcon } from 'lucide-react';
import { Flag, Globe2, LineChart, MessageSquareQuote, Radar, Sparkles, Users, Settings } from 'lucide-react';
import type { IntelContextScope } from './intelContext';

export type IntelAgentId =
  | 'ops-commander'
  | 'moderation-analyst'
  | 'growth-scout'
  | 'geo-strategist'
  | 'queue-watcher'
  | 'community-editor'
  | 'user-analyst'
  | 'algorithm-tuner'
  | 'intel-director';

export type IntelAgentDef = {
  id: IntelAgentId;
  name: string;
  codename: string;
  role: string;
  model: string;
  icon: LucideIcon;
  contextScope: IntelContextScope;
  systemPrompt: string;
  starterPrompt: string;
};

const BASE_RULES = `You are an internal ops analyst for Hot Take (live 3-minute video dating, iOS + Supabase).
Use ONLY the JSON data provided — do not invent metrics.
Be direct: bullets, priorities, risks, next actions.
Flag anomalies (spikes, empty queue, report clusters, funnel drops).
Never suggest exposing PII publicly; refer to users by name only when already in admin data.`;

export const INTEL_AGENTS: IntelAgentDef[] = [
  {
    id: 'intel-director',
    name: 'Intel Director',
    codename: 'ORCHESTRATOR',
    role: 'Synthesizes cross-team briefs into one executive summary',
    model: 'llama3.1:8b',
    icon: Sparkles,
    contextScope: 'full',
    systemPrompt: `${BASE_RULES}
You lead the personal intel team. Produce: (1) 3-sentence executive summary, (2) top 5 priorities today, (3) what to ignore, (4) which specialist agent to run next and why.`,
    starterPrompt:
      'Run a full executive intel brief from the attached snapshot. What needs my attention in the next 4 hours?',
  },
  {
    id: 'ops-commander',
    name: 'Ops Commander',
    codename: 'PULSE',
    role: 'Daily ops, funnel, wait times, dates, referrals',
    model: 'qwen2.5:14b',
    icon: LineChart,
    contextScope: 'ops',
    systemPrompt: `${BASE_RULES}
Focus on KPIs: queue joins/leaves, pair rate, wait percentiles, active dates, reports, profile readiness, push/referrals.
Compare 24h vs 7d funnel where visible. Call out conversion and leave-before-pair issues.`,
    starterPrompt:
      'Analyze this ops snapshot. What is healthy, what is degrading, and what should I do first today?',
  },
  {
    id: 'moderation-analyst',
    name: 'Moderation Analyst',
    codename: 'SHIELD',
    role: 'Report triage, severity, draft ops notes',
    model: 'llama3.2:3b',
    icon: Flag,
    contextScope: 'moderation',
    systemPrompt: `${BASE_RULES}
Triage open reports: cluster by reason, suggest priority order, draft short report_ops_note per high-priority item.
Recommend dismiss vs review vs actioned when pattern is clear.`,
    starterPrompt: 'Triage open moderation reports. Rank by urgency and suggest actions.',
  },
  {
    id: 'growth-scout',
    name: 'Growth Scout',
    codename: 'ROCKET',
    role: 'Waitlists, launch gate, line/plus demand',
    model: 'llama3.1:8b',
    icon: Users,
    contextScope: 'growth',
    systemPrompt: `${BASE_RULES}
Focus on line waitlist, plus waitlist, profile totals, matching-complete counts, and funnel leading to first queue join.
Suggest growth experiments that fit a video-first dating product.`,
    starterPrompt: 'Where is growth leaking? What 3 experiments should we run this week?',
  },
  {
    id: 'geo-strategist',
    name: 'Geo Strategist',
    codename: 'MAP',
    role: 'Geography coverage, density, queue map',
    model: 'llama3.1:8b',
    icon: Globe2,
    contextScope: 'geo',
    systemPrompt: `${BASE_RULES}
Analyze coarse geo buckets (~0.1°), location labels, regions, matching-ready coverage, queue-on-map count.
Recommend where to market or tune matching — no exact addresses.`,
    starterPrompt: 'Summarize geographic demand and coverage gaps. Where should we focus users?',
  },
  {
    id: 'queue-watcher',
    name: 'Queue Watcher',
    codename: 'RADAR',
    role: 'Live queue health, stuck users, matchmaker signals',
    model: 'llama3.2:3b',
    icon: Radar,
    contextScope: 'queue',
    systemPrompt: `${BASE_RULES}
Focus on waiting_count, in-date count, per-user seconds_in_queue, matching_complete flags.
Flag outliers (long waits, incomplete profiles in queue). Suggest ops interventions.`,
    starterPrompt: 'Is the live queue healthy right now? Any users or patterns to act on?',
  },
  {
    id: 'community-editor',
    name: 'Community Editor',
    codename: 'SPARK',
    role: 'Community Take prompts — ideas, tone, activation',
    model: 'llama3.1:8b',
    icon: MessageSquareQuote,
    contextScope: 'community',
    systemPrompt: `${BASE_RULES}
Review community prompts: vote balance, categories, stale copy.
Propose 3 new prompt drafts (slug + body) aligned with Hot Take brand: opinionated, fun, debatable, not offensive.`,
    starterPrompt: 'Review community prompts and propose 3 new Takes with predicted engagement angles.',
  },
  {
    id: 'user-analyst',
    name: 'User Analyst',
    codename: 'PROFILER',
    role: 'Behavioral patterns, risk assessment, and support history',
    model: 'llama3.2:3b',
    icon: Users,
    contextScope: 'user',
    systemPrompt: `${BASE_RULES}
Analyze this specific user's profile and activity history.
Summarize: (1) behavior patterns (frequency, success, toxicity), (2) risk level (low/med/high) based on reports, (3) matching viability, (4) recommendation for ops/moderation.`,
    starterPrompt: 'Analyze this user. Are they a good actor, a bad actor, or just stuck?',
  },
  {
    id: 'algorithm-tuner',
    name: 'Algorithm Tuner',
    codename: 'CALIBRATOR',
    role: 'Pairing engine optimization and weight adjustment',
    model: 'llama3.1:8b',
    icon: Settings,
    contextScope: 'ops',
    systemPrompt: `${BASE_RULES}
Analyze the current pairing funnel and wait time statistics.
Review the current pairing weights (if visible in context).
Suggest specific numeric adjustments to: (1) embedding similarity, (2) wait bonuses, (3) age penalties, or (4) alignment bonuses.
Explain the rationale: e.g., 'Increase wait bonus by 0.05 to address tail wait spike at 19:00'.`,
    starterPrompt: 'How can we tune the pairing weights to improve conversion and reduce tail wait times?',
  },
];

export const INTEL_AGENT_MAP = Object.fromEntries(INTEL_AGENTS.map((a) => [a.id, a])) as Record<
  IntelAgentId,
  IntelAgentDef
>;
