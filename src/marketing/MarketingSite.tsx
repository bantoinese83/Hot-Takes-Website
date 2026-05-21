import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronDown, Flame, Heart, Mail, Video } from 'lucide-react';
import { AnimatedGradientText } from '@/components/magicui/animated-gradient-text';
import '../magicui.css';
import { LaunchProgressMeter } from '../components/LaunchProgressMeter';
import { WaitlistCtaSection } from '../components/WaitlistCtaSection';
import { LaunchProgressProvider } from '../context/LaunchProgressContext';
import { CommunityVotePanel } from '../components/CommunityVotePanel';
import { HeroPhone } from '../components/HeroPhone';
import { LivePulseBoard } from '../components/LivePulseBoard';
import { MarketingFooter } from '../components/MarketingFooter';
import { MarketingHeader } from '../components/MarketingHeader';
import { MarketingMarquee } from '../components/MarketingMarquee';
import { MarketingStockGallery } from '../components/MarketingStockGallery';
import { NetworkDottedMapSection } from '../components/NetworkDottedMapSection';
import { Reveal } from '../components/Reveal';
import { TrustStrip } from '../components/TrustStrip';
import { useScrollSpy } from '../hooks/useScrollSpy';
import { FAQ_DATA, SITE } from '../siteCopy';

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export function MarketingSite() {
  const location = useLocation();
  const navigate = useNavigate();
  const isPrivacy = location.pathname === '/privacy';
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);
  const activeSection = useScrollSpy(
    ['home', 'live', 'previewer', 'features', 'waitlist', 'support'],
    !isPrivacy,
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isPrivacy]);

  useEffect(() => {
    document.title = isPrivacy
      ? `Privacy · ${SITE.appName}`
      : `${SITE.appName} — Live video speed dating`;
  }, [isPrivacy]);

  const goHome = (sectionId?: string) => {
    if (isPrivacy) {
      navigate('/');
      if (sectionId) window.setTimeout(() => scrollToId(sectionId), 120);
      return;
    }
    if (sectionId) scrollToId(sectionId);
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onNavSection = (id: string) => {
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    scrollToId(id);
  };

  return (
    <div className="app-shell marketing-magic">
      <MarketingHeader activeSection={activeSection} onNavSection={onNavSection} />

      <main id="main-content">
        {isPrivacy ? (
          <section className="legal-section">
            <div className="container">
              <Link to="/" className="btn-secondary legal-back">
                <ArrowLeft size={16} aria-hidden /> Back to home
              </Link>

              <div className="legal-card glass-card">
                <h1 className="legal-title">Privacy Policy</h1>
                <p className="legal-meta">Last updated: May 8, 2026</p>

                <div className="legal-block">
                  <h2>1. Introduction</h2>
                  <p>
                    {SITE.appName} is operated by {SITE.company}. This policy covers the mobile app and{' '}
                    {SITE.siteUrl.replace(/^https?:\/\//, '')}.
                  </p>
                </div>

                <div className="legal-block">
                  <h2>2. Information we collect</h2>
                  <ul>
                    <li>Account: email and password (Supabase Auth).</li>
                    <li>Profile: display name, age, preferences, approximate location label, and your Take.</li>
                    <li>
                      Location: coarse coordinates (~0.1°) for matching — not a live GPS trail on a public map.
                    </li>
                    <li>Live video: camera and mic during dates only; streams are not recorded on our servers.</li>
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
        ) : (
          <LaunchProgressProvider>
            <section className="hero" id="home">
              <div className="container hero-grid">
                <div className="hero-content">
                  <Reveal>
                    <p className="hero-announcement">
                      <span className="hero-announcement-dot" aria-hidden />
                      iOS · Join the waitlist
                    </p>
                    <h1 className="hero-title">
                      Skip the swiping.
                      <br />
                      <AnimatedGradientText colorFrom="#ff7a75" colorTo="#83cfff" className="hero-gradient-magic">
                        Go live on video.
                      </AnimatedGradientText>
                    </h1>
                    <p className="hero-description">{SITE.tagline}</p>
                    <p className="hero-description hero-description--sub">
                      Post your Take, join the queue, and get a {SITE.dateMinutes}-minute live video date. Mutual Match
                      opens chat.
                    </p>
                  </Reveal>

                  <Reveal delayMs={60}>
                    <div className="hero-ctas">
                      <button type="button" onClick={() => scrollToId('waitlist')} className="btn-primary">
                        Join waitlist <ArrowRight size={18} aria-hidden />
                      </button>
                      <button type="button" onClick={() => scrollToId('previewer')} className="btn-secondary">
                        Vote on a Take
                      </button>
                    </div>
                  </Reveal>
                </div>

                <Reveal delayMs={120} className="hero-mock-reveal">
                  <HeroPhone />
                </Reveal>
              </div>
            </section>

            <LaunchProgressMeter />

            <MarketingMarquee />
            <LivePulseBoard />
            <NetworkDottedMapSection />
            <CommunityVotePanel />
            <TrustStrip />

            <MarketingStockGallery />

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
                      body: 'One line on Profile. We use it as a light tie-breaker among people who already fit your preferences.',
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

            <WaitlistCtaSection onScrollToVote={() => scrollToId('previewer')} />

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
                          {isExpanded ? (
                            <div id={`faq-content-${index}`} className="faq-content">
                              <p>{item.answer}</p>
                            </div>
                          ) : null}
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
          </LaunchProgressProvider>
        )}
      </main>

      <MarketingFooter onGoHome={goHome} />
    </div>
  );
}
