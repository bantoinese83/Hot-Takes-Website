import { type FormEvent, useState } from 'react';
import { ArrowRight, Check, Loader2, Mail } from 'lucide-react';
import { BorderBeam } from '@/components/magicui/border-beam';
import { ShineBorder } from '@/components/magicui/shine-border';
import { LaunchProgressMeter } from './LaunchProgressMeter';
import { useLaunchProgress } from '../hooks/useLaunchProgress';
import { joinLaunchWaitlist } from '../lib/joinWaitlist';
import { SITE } from '../siteCopy';
import { Reveal } from './Reveal';

type Props = {
  onScrollToVote?: () => void;
};

export function WaitlistCtaSection({ onScrollToVote }: Props) {
  const { progress, applyProgress } = useLaunchProgress();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setSuccess(false);
    const result = await joinLaunchWaitlist(email);
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    if (result.progress) applyProgress(result.progress);
    setSuccess(true);
    const moved = !result.alreadyRegistered;
    setMessage(
      result.alreadyRegistered
        ? "You're already on the list — you're still moving the meter."
        : moved
          ? "You're on the list — you just pushed the launch meter."
          : "You're on the waitlist. We'll email when Hot Take opens in your area.",
    );
    setEmail('');
  };

  return (
    <section className="waitlist-section" id="waitlist" aria-labelledby="waitlist-heading">
      <div className="container">
        <Reveal>
          <div className="waitlist-card glass-card relative overflow-hidden">
            <ShineBorder shineColor={['#ff544e', '#83cfff']} duration={16} borderWidth={1} />
            <BorderBeam size={100} duration={10} colorFrom="#ff7a75" colorTo="#83cfff" />
            <div className="waitlist-card-grid relative z-[1]">
              <div className="waitlist-copy">
                <span className="section-label">Early access</span>
                <h2 id="waitlist-heading" className="waitlist-title">
                  Join the waitlist
                </h2>
                <p className="waitlist-description">
                  {progress.unlocked
                    ? `The waitlist hit its goal — ${SITE.appName} on iOS is unlocking. Get on the list for your invite wave.`
                    : `${SITE.appName} ships on iOS only after ${progress.waitlistGoal.toLocaleString()} people join. Every email moves the meter — live ${SITE.dateMinutes}-minute video dates when we open.`}
                </p>
                <LaunchProgressMeter compact />
                <ul className="waitlist-checklist">
                  <li>No spam — one invite email when a slot opens</li>
                  <li>Vote on Takes on the web while you wait</li>
                  <li>First in line gets notified before public launch</li>
                </ul>
              </div>
              <div className="waitlist-actions">
                <form className="waitlist-form" onSubmit={(ev) => void onSubmit(ev)} noValidate>
                  <label className="waitlist-field">
                    <span className="sr-only">Email address</span>
                    <Mail size={18} className="waitlist-field-icon" aria-hidden />
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(ev) => setEmail(ev.target.value)}
                      disabled={busy}
                      required
                    />
                  </label>
                  <button type="submit" className="btn-primary waitlist-btn-primary" disabled={busy}>
                    {busy ? (
                      <>
                        <Loader2 size={18} className="waitlist-spin" aria-hidden /> Joining…
                      </>
                    ) : (
                      <>
                        Join waitlist <ArrowRight size={18} aria-hidden />
                      </>
                    )}
                  </button>
                </form>
                {message ? (
                  <p className={`waitlist-feedback ${success ? 'waitlist-feedback--ok' : 'waitlist-feedback--err'}`} role="status">
                    {success ? <Check size={16} aria-hidden /> : null}
                    {message}
                  </p>
                ) : null}
                {onScrollToVote ? (
                  <button type="button" className="btn-secondary" onClick={onScrollToVote}>
                    Try a Take on the web first
                  </button>
                ) : null}
                <p className="waitlist-footnote">
                  Questions?{' '}
                  <a href={`mailto:${SITE.supportEmail}`} className="waitlist-email-link">
                    {SITE.supportEmail}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
