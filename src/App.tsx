import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Flame,
  Heart,
  Mail,
  Shield,
  Smartphone,
  Video,
} from 'lucide-react';
import { CommunityVotePanel } from './components/CommunityVotePanel';
import { HeroPhone } from './components/HeroPhone';
import { LivePulseBoard } from './components/LivePulseBoard';
import { Reveal } from './components/Reveal';
import { useScrollSpy } from './hooks/useScrollSpy';
import { FAQ_DATA, SITE } from './siteCopy';

type View = 'home' | 'privacy';

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);
  const activeSection = useScrollSpy(['home', 'live', 'previewer', 'features', 'support'], currentView === 'home');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const goHome = (sectionId?: string) => {
    setCurrentView('home');
    if (sectionId) {
      window.setTimeout(() => scrollToId(sectionId), 80);
    }
  };

  const navClass = (id: string, view?: View) => {
    if (view === 'privacy' && currentView === 'privacy') return 'nav-item active-link';
    if (currentView === 'home' && activeSection === id) return 'nav-item active-link';
    return 'nav-item';
  };

  return (
    <div className="app-shell">
      <header className="nav-bar">
        <div className="container nav-container">
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              goHome('home');
            }}
            className="logo-link"
          >
            <img className="logo-mark" src="/app-logo.png" alt={SITE.appName} />
          </a>
          <nav className="nav-links">
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                goHome('home');
              }}
              className={navClass('home')}
            >
              Home
            </a>
            <a
              href="#live"
              onClick={(e) => {
                e.preventDefault();
                goHome('live');
              }}
              className={navClass('live')}
            >
              Live
            </a>
            <a
              href="#previewer"
              onClick={(e) => {
                e.preventDefault();
                goHome('previewer');
              }}
              className={navClass('previewer')}
            >
              Vote
            </a>
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                goHome('features');
              }}
              className={navClass('features')}
            >
              How it works
            </a>
            <a
              href="#support"
              onClick={(e) => {
                e.preventDefault();
                goHome('support');
              }}
              className={navClass('support')}
            >
              FAQ
            </a>
            <a
              href="#privacy"
              onClick={(e) => {
                e.preventDefault();
                setCurrentView('privacy');
              }}
              className={navClass('privacy', 'privacy')}
            >
              Privacy
            </a>
          </nav>
        </div>
      </header>

      <main>
        {currentView === 'home' ? (
          <>
            <section className="hero" id="home">
              <div className="container hero-grid">
                <div className="hero-content">
                  <Reveal>
                    <p className="hero-announcement">
                      <Smartphone size={16} aria-hidden />
                      iOS app — TestFlight beta
                    </p>
                    <h1 className="hero-title">
                      Skip the swiping.
                      <br />
                      <span className="gradient-text">Go live on video.</span>
                    </h1>
                    <p className="hero-description">
                      Post your Take, join the queue, and get a {SITE.dateMinutes}-minute live video date. Mutual Match
                      opens chat.
                    </p>
                  </Reveal>

                  <Reveal delayMs={60}>
                    <div className="hero-ctas">
                      <button
                        type="button"
                        onClick={() => scrollToId('previewer')}
                        className="btn-primary"
                      >
                        Vote on a Take <ArrowRight size={18} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollToId('features')}
                        className="btn-secondary"
                      >
                        How it works
                      </button>
                    </div>
                  </Reveal>
                </div>

                <Reveal delayMs={120} className="hero-mock-reveal">
                  <HeroPhone />
                </Reveal>
              </div>
            </section>

            <LivePulseBoard />

            <CommunityVotePanel />

            <section className="features-section" id="features">
              <div className="container">
                <Reveal>
                  <div className="section-header">
                    <span className="section-label">How it works</span>
                    <h2 className="section-title">Three steps, one live conversation</h2>
                  </div>
                </Reveal>

                <div className="features-grid">
                  {[
                    {
                      icon: Flame,
                      title: 'Your Take',
                      body: 'Add one line on Profile. We use AI to find people with similar vibes as a tie-breaker among those who fit your preferences.',
                    },
                    {
                      icon: Video,
                      title: 'Live video date',
                      body: `Tap Start live matching on the Dating tab. When paired, you get ${SITE.dateMinutes} minutes on camera.`,
                    },
                    {
                      icon: Heart,
                      title: 'Match or Pass',
                      body: 'Choose Match after the date. If you both match, messaging unlocks under Matches.',
                    },
                  ].map((item, i) => (
                    <Reveal key={item.title} delayMs={i * 70} className="feature-reveal">
                      <article className="feature-card glass-card feature-card--interactive">
                        <div className="feature-icon-wrapper">
                          <item.icon size={24} aria-hidden />
                        </div>
                        <h3 className="feature-title">{item.title}</h3>
                        <p className="feature-description">{item.body}</p>
                      </article>
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>

            <section className="support-section" id="support">
              <div className="container">
                <Reveal>
                  <div className="section-header">
                    <span className="section-label">FAQ</span>
                    <h2 className="section-title">Questions</h2>
                  </div>
                </Reveal>

                <div className="faq-list">
                  {FAQ_DATA.map((item, index) => {
                    const isExpanded = expandedFaqIndex === index;
                    return (
                      <Reveal key={item.question} delayMs={index * 40}>
                        <div className={`faq-item ${isExpanded ? 'expanded' : ''}`}>
                          <button
                            type="button"
                            onClick={() => setExpandedFaqIndex(isExpanded ? null : index)}
                            className="faq-trigger"
                            aria-expanded={isExpanded}
                            aria-controls={`faq-content-${index}`}
                          >
                            <span>{item.question}</span>
                            <ChevronDown size={18} className="faq-chevron" aria-hidden />
                          </button>
                          {isExpanded && (
                            <div id={`faq-content-${index}`} className="faq-content">
                              <p>{item.answer}</p>
                            </div>
                          )}
                        </div>
                      </Reveal>
                    );
                  })}
                </div>

                <Reveal delayMs={80}>
                  <p className="support-email-line">
                    <Mail size={16} aria-hidden />
                    <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
                  </p>
                </Reveal>
              </div>
            </section>
          </>
        ) : (
          <section className="legal-section">
            <div className="container">
              <button
                type="button"
                onClick={() => setCurrentView('home')}
                className="btn-secondary legal-back"
              >
                <ArrowLeft size={16} aria-hidden /> Back
              </button>

              <div className="legal-card glass-card">
                <h1 className="legal-title">Privacy Policy</h1>
                <p className="legal-meta">Last updated: May 8, 2026</p>

                <div className="legal-block">
                  <h2>1. Introduction</h2>
                  <p>
                    {SITE.appName} is operated by {SITE.company}. This policy covers the mobile app and hottakedate.com.
                  </p>
                </div>

                <div className="legal-block">
                  <h2>2. Information we collect</h2>
                  <ul>
                    <li>Account: email and password (Supabase Auth).</li>
                    <li>Profile: display name, age, preferences, and your Take.</li>
                    <li>Live video: camera and mic are used only during dates; streams are not recorded on our servers.</li>
                    <li>Matching: queue state, match outcomes, and messages when both users match.</li>
                  </ul>
                </div>

                <div className="legal-block">
                  <h2>3. How we use it</h2>
                  <ul>
                    <li>Authenticate you and run matchmaking.</li>
                    <li>Connect live video via encrypted WebRTC (LiveKit).</li>
                    <li>Support, safety, and abuse reports.</li>
                  </ul>
                </div>

                <div className="legal-block">
                  <h2>4. Deletion</h2>
                  <p>
                    Profile → Delete account removes your credentials, profile, queue data, and match history. This is
                    permanent.
                  </p>
                </div>

                <div className="legal-block">
                  <h2>5. Contact</h2>
                  <p>
                    <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <img className="logo-mark logo-mark--footer" src="/app-logo.png" alt={SITE.appName} />
              <p className="footer-motto">
                {SITE.dateMinutes}-minute live video dates. Built by {SITE.company}.
              </p>
            </div>

            <div className="footer-links-column">
              <h4 className="footer-col-title">Site</h4>
              <a
                href="#home"
                onClick={(e) => {
                  e.preventDefault();
                  goHome('home');
                }}
                className="footer-link"
              >
                Home
              </a>
              <a
                href="#support"
                onClick={(e) => {
                  e.preventDefault();
                  goHome('support');
                }}
                className="footer-link"
              >
                FAQ
              </a>
              <a
                href="#privacy"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentView('privacy');
                }}
                className="footer-link"
              >
                Privacy
              </a>
              <a href={`mailto:${SITE.supportEmail}`} className="footer-link">
                Contact
              </a>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} {SITE.company}</p>
            <p className="footer-secure">
              <Shield size={14} aria-hidden /> Encrypted live video (WebRTC)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
