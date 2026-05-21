import { useEffect, useState } from 'react';
import { Flame, Radio, Users, Video, Zap } from 'lucide-react';
import { BorderBeam } from '@/components/magicui/border-beam';
import { NumberTicker } from '@/components/magicui/number-ticker';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { DEMO_PULSE, subscribeLivePulse, type LivePulseStats } from '../lib/livePulse';
import { isSupabaseConfigured } from '../lib/supabase';
import { SITE } from '../siteCopy';
import { Reveal } from './Reveal';

function PulseStat({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: number;
  icon: typeof Video;
  accent?: boolean;
}) {
  return (
    <div className={`pulse-stat ${accent ? 'pulse-stat--accent' : ''}`}>
      <span className="pulse-stat-icon" aria-hidden>
        <Icon size={18} strokeWidth={2.25} />
      </span>
      <span className="pulse-stat-value">
        <NumberTicker value={value} className="!text-inherit" />
      </span>
      <span className="pulse-stat-label">{label}</span>
    </div>
  );
}

function RadarVisual({ activeDates, waitingCount }: { activeDates: number; waitingCount: number }) {
  const energy = Math.min(8, activeDates + Math.ceil(waitingCount / 3));
  const blips = Array.from({ length: Math.max(3, energy) }, (_, i) => i);

  return (
    <div className="pulse-radar" aria-hidden>
      <span className="pulse-radar-ring pulse-radar-ring--outer" />
      <span className="pulse-radar-ring pulse-radar-ring--mid" />
      <span className="pulse-radar-ring pulse-radar-ring--inner" />
      <span className="pulse-radar-core">
        <Video size={28} strokeWidth={2} />
      </span>
      {blips.map((i) => (
        <span
          key={i}
          className="pulse-radar-blip"
          style={{
            ['--pulse-angle' as string]: `${(360 / blips.length) * i}deg`,
            ['--pulse-delay' as string]: `${i * 0.35}s`,
          }}
        />
      ))}
    </div>
  );
}

export function LivePulseBoard() {
  const [stats, setStats] = useState<LivePulseStats>(DEMO_PULSE);
  const activeDisplay = useAnimatedNumber(stats.activeDates, 800);

  useEffect(() => subscribeLivePulse(setStats), []);

  const headline =
    stats.activeDates === 0
      ? stats.waitingCount > 0
        ? `${stats.waitingCount} in the queue — pairing spins up when two vibes align`
        : 'The network is quiet — be first in when you open the app'
      : stats.activeDates === 1
        ? '1 live video date happening now'
        : `${activeDisplay.toLocaleString()} live video dates happening now`;

  return (
    <section className="live-pulse-section" id="live" aria-labelledby="live-pulse-heading">
      <div className="container">
        <Reveal>
          <div className="live-pulse-board glass-card relative overflow-hidden">
            <BorderBeam size={80} duration={8} colorFrom="#ff544e" colorTo="#83cfff" borderWidth={1} />
            <div className="live-pulse-header">
              <span className="live-pulse-badge">
                <span className="live-pulse-dot" />
                <Radio size={14} aria-hidden />
                {stats.isLive ? 'Live network pulse' : 'Pulse preview'}
              </span>
              {!stats.isLive && !isSupabaseConfigured ? (
                <span className="live-pulse-hint">Connect Supabase env for real counts</span>
              ) : null}
            </div>

            <div className="live-pulse-grid">
              <div className="live-pulse-copy">
                <h2 id="live-pulse-heading" className="live-pulse-title">
                  {headline}
                </h2>
                <p className="live-pulse-sub">
                  Real counts from Hot Take — active {SITE.dateMinutes}-minute video dates, people in queue, and
                  community votes. No video feeds, just energy.
                </p>
                {stats.datesStartedLastHour > 0 ? (
                  <p className="live-pulse-footnote">
                    <Zap size={14} aria-hidden />
                    {stats.datesStartedLastHour} date{stats.datesStartedLastHour === 1 ? '' : 's'} started in the
                    last hour
                  </p>
                ) : null}
              </div>

              <RadarVisual activeDates={stats.activeDates} waitingCount={stats.waitingCount} />
            </div>

            <div className="live-pulse-stats">
              <PulseStat label="Live dates" value={stats.activeDates} icon={Video} accent />
              <PulseStat label="In queue" value={stats.waitingCount} icon={Users} />
              <PulseStat label="Started (1h)" value={stats.datesStartedLastHour} icon={Zap} />
              <PulseStat label="Community votes" value={stats.communityVotesTotal} icon={Flame} />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
