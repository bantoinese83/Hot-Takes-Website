import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { SITE } from '../siteCopy';

type Props = {
  onGoHome: (sectionId?: string) => void;
};

export function MarketingFooter({ onGoHome }: Props) {
  return (
    <footer className="app-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <img className="logo-mark logo-mark--footer" src="/app-logo.png" alt={SITE.appName} width={200} height={64} />
            <p className="footer-motto">{SITE.tagline}</p>
            <p className="footer-motto-sub">
              {SITE.dateMinutes}-minute live video dates · {SITE.company}
            </p>
          </div>

          <div className="footer-links-column">
            <h4 className="footer-col-title">Explore</h4>
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                onGoHome('home');
              }}
              className="footer-link"
            >
              Home
            </a>
            <a
              href="#live"
              onClick={(e) => {
                e.preventDefault();
                onGoHome('live');
              }}
              className="footer-link"
            >
              Live pulse
            </a>
            <a
              href="#previewer"
              onClick={(e) => {
                e.preventDefault();
                onGoHome('previewer');
              }}
              className="footer-link"
            >
              Vote on Takes
            </a>
            <a
              href="#waitlist"
              onClick={(e) => {
                e.preventDefault();
                onGoHome('waitlist');
              }}
              className="footer-link"
            >
              Join waitlist
            </a>
          </div>

          <div className="footer-links-column">
            <h4 className="footer-col-title">Legal & support</h4>
            <Link to="/privacy" className="footer-link">
              Privacy
            </Link>
            <a href={`mailto:${SITE.supportEmail}`} className="footer-link">
              {SITE.supportEmail}
            </a>
            <a
              href="#support"
              onClick={(e) => {
                e.preventDefault();
                onGoHome('support');
              }}
              className="footer-link"
            >
              FAQ
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} {SITE.company}
          </p>
          <p className="footer-secure">
            <Shield size={14} aria-hidden /> Encrypted live video (WebRTC)
          </p>
        </div>
      </div>
    </footer>
  );
}
