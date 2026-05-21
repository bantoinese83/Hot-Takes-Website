import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { SITE } from '../siteCopy';

type Props = {
  activeSection: string;
  onNavSection: (id: string) => void;
};

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'live', label: 'Live' },
  { id: 'previewer', label: 'Vote' },
  { id: 'features', label: 'How it works' },
  { id: 'waitlist', label: 'Waitlist' },
  { id: 'support', label: 'FAQ' },
] as const;

export function MarketingHeader({ activeSection, onNavSection }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const onPrivacy = location.pathname === '/privacy';

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, activeSection]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const goSection = (id: string) => {
    if (onPrivacy) {
      navigate('/');
      window.setTimeout(() => onNavSection(id), 80);
    } else {
      onNavSection(id);
    }
    setMenuOpen(false);
  };

  const navClass = (id: string) => {
    if (onPrivacy) return 'nav-item';
    if (activeSection === id) return 'nav-item active-link';
    return 'nav-item';
  };

  return (
    <header className="nav-bar">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="container nav-container">
        <Link to="/" className="logo-link" onClick={() => goSection('home')}>
          <img className="logo-mark logo-mark--nav" src="/app-logo.png" alt={SITE.appName} width={160} height={48} />
        </Link>

        <button
          type="button"
          className="nav-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="site-nav"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
          <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
        </button>

        <nav id="site-nav" className={`nav-links ${menuOpen ? 'nav-links--open' : ''}`} aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                goSection(item.id);
              }}
              className={navClass(item.id)}
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/privacy"
            className={onPrivacy ? 'nav-item active-link' : 'nav-item'}
            onClick={() => setMenuOpen(false)}
          >
            Privacy
          </Link>
          <a href="#waitlist" className="nav-cta" onClick={(e) => { e.preventDefault(); goSection('waitlist'); }}>
            Join waitlist
          </a>
        </nav>
      </div>
      {menuOpen ? (
        <button type="button" className="nav-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
      ) : null}
    </header>
  );
}
