import { Fragment } from 'react';
import { CheckCircle, Heart, User, Users, Video, Wifi } from 'lucide-react';

const FLOW_STEPS = [
  { icon: Users, title: 'Pair', caption: 'We find someone' },
  { icon: Video, title: 'Video', caption: '3 min live' },
  { icon: Heart, title: 'Decide', caption: 'Match if mutual' },
] as const;

const QUICK_CHECKS = [
  { icon: Video, text: 'Camera & mic turn on when the date begins.' },
  { icon: Wifi, text: 'Steady Wi‑Fi or LTE and decent light help.' },
] as const;

/** Static replica of iOS `DatingReadyView` for the marketing phone mockup. */
export function MockDatingReadyScreen() {
  return (
    <div className="mock-dating-ready" aria-hidden>
      <p className="mock-nav-title">Hot Take</p>

      <div className="mock-dating-scroll">
        <div className="mock-hero-block">
          <div className="mock-hero-glow" />
          <img className="mock-hero-logo" src="/app-logo.png" alt="" />
          <h2 className="mock-hero-title">When you&apos;re ready</h2>
        </div>

        <p className="mock-hero-subcopy">
          Three minutes, live on video. Add your take in Profile anytime.
        </p>

        <div className="mock-flow-card">
          {FLOW_STEPS.map((step, index) => (
            <Fragment key={step.title}>
              {index > 0 && <span className="mock-flow-connector" aria-hidden />}
              <div className="mock-flow-step">
                <span className="mock-flow-icon-ring">
                  <step.icon size={15} strokeWidth={2.25} />
                </span>
                <span className="mock-flow-step-title">{step.title}</span>
                <span className="mock-flow-step-caption">{step.caption}</span>
              </div>
            </Fragment>
          ))}
        </div>

        <button type="button" className="mock-cta-pill" tabIndex={-1}>
          Start live matching
        </button>

        <div className="mock-quick-card">
          <p className="mock-quick-heading">
            <CheckCircle size={14} strokeWidth={2.25} />
            Quick checks
          </p>
          {QUICK_CHECKS.map((row) => (
            <div key={row.text} className="mock-quick-row">
              <row.icon size={13} strokeWidth={2.25} className="mock-quick-icon" />
              <span>{row.text}</span>
            </div>
          ))}
        </div>
      </div>

      <nav className="mock-tab-bar" aria-hidden>
        <span className="mock-tab mock-tab--active">
          <span className="mock-tab-icon-wrap mock-tab-icon-wrap--active">
            <Video size={18} fill="currentColor" strokeWidth={0} />
          </span>
          <span className="mock-tab-label">Dating</span>
        </span>
        <span className="mock-tab">
          <span className="mock-tab-icon-wrap">
            <Heart size={17} strokeWidth={2} />
          </span>
          <span className="mock-tab-label">Matches</span>
        </span>
        <span className="mock-tab">
          <span className="mock-tab-icon-wrap">
            <User size={17} strokeWidth={2} />
          </span>
          <span className="mock-tab-label">Profile</span>
        </span>
      </nav>
    </div>
  );
}
