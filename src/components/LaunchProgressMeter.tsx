import { useMemo } from 'react';
import { Flame, Radio, Sparkles, Users } from 'lucide-react';
import { NumberTicker } from '@/components/magicui/number-ticker';
import { useLaunchProgress } from '../hooks/useLaunchProgress';
import { SITE } from '../siteCopy';
import { Reveal } from './Reveal';

const MILESTONES = [25, 50, 75, 100] as const;

type Props = {
  compact?: boolean;
  className?: string;
};

export function LaunchProgressMeter({ compact = false, className = '' }: Props) {
  const { progress, live, error } = useLaunchProgress();
  const { signupCount, waitlistGoal, remaining, percent, unlocked, headline } = progress;

  const displayPercent = Math.min(100, Math.max(0, percent));
  const arcLength = 283;
  const dashOffset = arcLength - (arcLength * displayPercent) / 100;

  const statusCopy = useMemo(() => {
    if (unlocked) {
      return {
        title: 'The waitlist hit its goal',
        sub: `We're opening ${SITE.appName} on iOS — invite waves start soon.`,
      };
    }
    if (remaining <= 10) {
      return {
        title: 'Almost there',
        sub: `Only ${remaining} more ${remaining === 1 ? 'person' : 'people'} until we flip the switch.`,
      };
    }
    if (remaining <= 50) {
      return {
        title: 'The line is heating up',
        sub: `${remaining} more signups unlock the app for everyone on the list.`,
      };
    }
    return {
      title: headline,
      sub: `${waitlistGoal.toLocaleString()} signups unlock the iOS app — live ${SITE.dateMinutes}-minute video dates for everyone on the list.`,
    };
  }, [unlocked, remaining, waitlistGoal, headline]);

  if (compact) {
    return (
      <div className={`launch-meter launch-meter--compact ${className}`} aria-live="polite">
        <div className="launch-meter-compact-track" role="progressbar" aria-valuenow={displayPercent} aria-valuemin={0} aria-valuemax={100}>
          <div className="launch-meter-compact-fill" style={{ width: `${displayPercent}%` }} />
        </div>
        <p className="launch-meter-compact-label">
          <Flame size={14} aria-hidden />
          <strong>
            <NumberTicker value={signupCount} className="launch-meter-ticker" />
          </strong>
          <span> / {waitlistGoal.toLocaleString()} {unlocked ? '· Unlocked' : ''}</span>
        </p>
      </div>
    );
  }

  return (
    <section className={`launch-meter-section ${className}`} aria-labelledby="launch-meter-heading">
      <div className="container">
        <Reveal>
          <div className={`launch-meter-card glass-card ${unlocked ? 'launch-meter-card--unlocked' : ''}`}>
            <div className="launch-meter-glow" aria-hidden />
            <header className="launch-meter-header">
              <span className="launch-meter-badge">
                {live ? (
                  <>
                    <span className="launch-meter-live-dot" />
                    <Radio size={12} aria-hidden /> Live
                  </>
                ) : (
                  'Launch gate'
                )}
              </span>
              <h2 id="launch-meter-heading" className="launch-meter-title">
                {statusCopy.title}
              </h2>
              <p className="launch-meter-sub">{statusCopy.sub}</p>
            </header>

            <div className="launch-meter-body">
              <div className="launch-meter-gauge" role="progressbar" aria-valuenow={displayPercent} aria-valuemin={0} aria-valuemax={100} aria-label={`${signupCount} of ${waitlistGoal} signups`}>
                <svg viewBox="0 0 120 120" className="launch-meter-svg" aria-hidden>
                  <circle cx="60" cy="60" r="45" className="launch-meter-ring-bg" />
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    className="launch-meter-ring-fill"
                    strokeDasharray={arcLength}
                    strokeDashoffset={dashOffset}
                  />
                  {MILESTONES.map((m) => {
                    const angle = ((m / 100) * 270 - 135) * (Math.PI / 180);
                    const x = 60 + 45 * Math.cos(angle);
                    const y = 60 + 45 * Math.sin(angle);
                    return (
                      <circle
                        key={m}
                        cx={x}
                        cy={y}
                        r={displayPercent >= m ? 2.2 : 1.4}
                        className={displayPercent >= m ? 'launch-meter-milestone launch-meter-milestone--lit' : 'launch-meter-milestone'}
                      />
                    );
                  })}
                </svg>
                <div className="launch-meter-center">
                  {unlocked ? (
                    <Sparkles size={28} className="launch-meter-unlock-icon" aria-hidden />
                  ) : (
                    <Flame size={28} className="launch-meter-flame-icon" aria-hidden />
                  )}
                  <p className="launch-meter-count">
                    <NumberTicker value={signupCount} className="launch-meter-ticker launch-meter-ticker--hero" />
                  </p>
                  <p className="launch-meter-of">of {waitlistGoal.toLocaleString()}</p>
                </div>
              </div>

              <div className="launch-meter-stats">
                <div className="launch-meter-stat">
                  <Users size={16} aria-hidden />
                  <span className="launch-meter-stat-label">On the list</span>
                  <span className="launch-meter-stat-value">
                    <NumberTicker value={signupCount} className="launch-meter-ticker" />
                  </span>
                </div>
                <div className="launch-meter-stat">
                  <Flame size={16} aria-hidden />
                  <span className="launch-meter-stat-label">{unlocked ? 'Status' : 'To unlock'}</span>
                  <span className="launch-meter-stat-value">
                    {unlocked ? 'Open' : remaining.toLocaleString()}
                  </span>
                </div>
                <div className="launch-meter-stat">
                  <Sparkles size={16} aria-hidden />
                  <span className="launch-meter-stat-label">Progress</span>
                  <span className="launch-meter-stat-value">{displayPercent.toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {error ? <p className="launch-meter-error">{error}</p> : null}

            <p className="launch-meter-foot">
              {unlocked
                ? 'Goal reached — we release the app when the list is ready, not before.'
                : 'Your signup moves the meter. We only ship iOS when this fills.'}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
