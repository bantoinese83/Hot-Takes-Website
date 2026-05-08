import { useState, useEffect } from 'react';
import { 
  Flame, 
  Heart, 
  Video, 
  Shield, 
  ArrowRight, 
  ChevronDown, 
  RefreshCw, 
  Mail, 
  ArrowLeft 
} from 'lucide-react';

// ==========================================
// HOT TAKE DATA & TYPES
// ==========================================
interface HotTakeItem {
  id: string;
  category: string;
  question: string;
  hot: number;  // Base "Agree" percentage
  cold: number; // Base "Disagree" percentage
}

const HOT_TAKES_DATA: HotTakeItem[] = [
  { 
    id: 'food', 
    category: 'Food Debates', 
    question: 'Pineapple absolutely belongs on pizza, no questions asked.', 
    hot: 62, 
    cold: 38 
  },
  { 
    id: 'pop', 
    category: 'Pop Culture', 
    question: 'Movie adaptations are almost always superior to the original books.', 
    hot: 28, 
    cold: 72 
  },
  { 
    id: 'tech', 
    category: 'Technology', 
    question: 'Dark mode is a visual masterpiece; light mode is a crime against eyes.', 
    hot: 87, 
    cold: 13 
  },
  { 
    id: 'dating', 
    category: 'Dating Culture', 
    question: 'A phone call on the first day of matching is much better than texting for a week.', 
    hot: 74, 
    cold: 26 
  }
];

// ==========================================
// FAQ DATA
// ==========================================
interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    question: "What makes Hot Take different from standard dating apps?",
    answer: "Hot Take brings real chemistry back to dating by cutting out the swiping fatigue and weeks of dry texting. Instead of superficial profile scrolls, you share your controversial, funny, or passionate Hot Take and join our live speed matchmaking queue. When a match is found, you connect on a private 3-minute video date to talk, debate, and experience real chemistry in real-time."
  },
  {
    question: "Is my privacy and video feed secure?",
    answer: "Absolutely. Your privacy is our highest priority. All live speed dates are routed through secure, encrypted WebRTC connections powered by LiveKit Cloud. We never record, store, or monitor any of your live audio or video streams. Your live conversations are strictly between you and your date."
  },
  {
    question: "Do I need to enable my camera and microphone?",
    answer: "Yes, camera and microphone access is required to use Hot Take. Apple App Store guidelines and our matchmaking system require active media capture so you and your match can see and hear each other. We prompt you clearly with a descriptive sheet before requesting these permissions from iOS."
  },
  {
    question: "How do I match and continue chatting after a date?",
    answer: "During or immediately after your 3-minute speed date, you can tap the 'Match' button if you felt a spark. If your date also selects 'Match', you will instantly unlock a permanent match with direct text messaging in your 'Matches' tab so you can coordinate your first official in-person date."
  },
  {
    question: "How do I delete my account and personal data?",
    answer: "You are in full control of your personal data. You can delete your account permanently at any time. Simply navigate to the Profile tab inside the iOS app, tap 'Delete account', and confirm. Your auth credentials, matchmaking logs, profile records, and chat history will be instantly and permanently deleted from our servers."
  },
  {
    question: "How can I contact Support for assistance or user reports?",
    answer: "We are committed to maintaining a safe, fun, and respectful speed-dating environment. If you need help with your account, have questions, or wish to report inappropriate user behavior, please email our support team directly at support@hottakedate.com. Our safety team reviews reports 24/7."
  }
];

// ==========================================
// MAIN APP COMPONENT
// ==========================================
function App() {
  const [currentView, setCurrentView] = useState<'home' | 'privacy'>('home');
  const [activeTabId, setActiveTabId] = useState<string>('food');
  const [votedIds, setVotedIds] = useState<Record<string, 'hot' | 'cold'>>({});
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  // Scroll to top on view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const activeHotTake = HOT_TAKES_DATA.find(item => item.id === activeTabId) || HOT_TAKES_DATA[0];
  const userVote = votedIds[activeTabId];

  const handleVote = (vote: 'hot' | 'cold') => {
    setVotedIds(prev => ({ ...prev, [activeTabId]: vote }));
  };

  const handleResetVote = () => {
    setVotedIds(prev => {
      const updated = { ...prev };
      delete updated[activeTabId];
      return updated;
    });
  };

  // Calculate percentage based on vote
  const getPercentages = (item: HotTakeItem) => {
    const userChoice = votedIds[item.id];
    if (!userChoice) return { hot: item.hot, cold: item.cold };
    
    // Adjust percentages slightly if user votes to make it interactive!
    if (userChoice === 'hot') {
      const total = item.hot + item.cold + 1;
      return {
        hot: Math.round(((item.hot + 1) / total) * 100),
        cold: Math.round((item.cold / total) * 100)
      };
    } else {
      const total = item.hot + item.cold + 1;
      return {
        hot: Math.round((item.hot / total) * 100),
        cold: Math.round(((item.cold + 1) / total) * 100)
      };
    }
  };

  const currentPercentages = getPercentages(activeHotTake);

  return (
    <div id="root">
      {/* ─── NAVIGATION BAR ─── */}
      <header className="nav-bar">
        <div className="container nav-container">
          <a href="#home" onClick={(e) => { e.preventDefault(); setCurrentView('home'); }} className="logo-link">
            <img className="logo-icon" src="/speed-dating.svg" alt="Hot Take logo" />
            <span className="logo-text">Hot Take</span>
          </a>
          <nav className="nav-links">
            <a 
              href="#home" 
              onClick={(e) => { e.preventDefault(); setCurrentView('home'); }} 
              className={`nav-item ${currentView === 'home' ? 'active-link' : ''}`}
            >
              Home
            </a>
            <a 
              href="#features" 
              onClick={(e) => { if (currentView !== 'home') { e.preventDefault(); setCurrentView('home'); setTimeout(() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }), 100); } }} 
              className="nav-item"
            >
              Features
            </a>
            <a 
              href="#support" 
              onClick={(e) => { if (currentView !== 'home') { e.preventDefault(); setCurrentView('home'); setTimeout(() => document.getElementById('support')?.scrollIntoView({ behavior: 'smooth' }), 100); } }} 
              className="nav-item"
            >
              Support & FAQ
            </a>
            <a 
              href="#privacy" 
              onClick={(e) => { e.preventDefault(); setCurrentView('privacy'); }} 
              className={`nav-item ${currentView === 'privacy' ? 'active-link' : ''}`}
            >
              Privacy Policy
            </a>
          </nav>
        </div>
      </header>

      {/* ─── CONDITIONAL VIEW RENDERING ─── */}
      <main>
        {currentView === 'home' ? (
          <>
            {/* ─── HERO SECTION ─── */}
            <section className="hero" id="home">
              <div className="container hero-grid">
                <div className="hero-content">
                  <div className="hero-announcement">
                    <Heart size={16} /> Cupid-approved matchmaking is live on TestFlight
                  </div>
                  <h1 className="hero-title">
                    Skip the swiping.<br />
                    <span className="gradient-text">Go live instantly.</span>
                  </h1>
                  <p className="hero-description">
                    The dating app built for real connection. Share your favorite Hot Take, enter the speed-dating queue, and engage in live 3-minute video dates. No swipe grind. Real chemistry.
                  </p>
                  
                  <div className="hero-ctas">
                    <button 
                      onClick={() => document.getElementById('previewer')?.scrollIntoView({ behavior: 'smooth' })} 
                      className="btn-primary"
                    >
                      Try Interactive Preview <ArrowRight size={18} />
                    </button>
                    <a 
                      href="#support" 
                      onClick={(e) => { e.preventDefault(); document.getElementById('support')?.scrollIntoView({ behavior: 'smooth' }); }} 
                      className="btn-secondary"
                    >
                      Need Help?
                    </a>
                  </div>

                  <div className="hero-badges">
                    <div className="btn-badge">
                      <Flame size={24} className="gradient-text" />
                      <div>
                        <span className="badge-subtitle">Download iOS App</span>
                        <span className="badge-title">App Store TestFlight</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mockup-container">
                  <div className="phone-mockup">
                    <div className="phone-notch"></div>
                    <div className="phone-screen">
                      <div className="mock-app-header">
                        <img className="logo-icon" src="/speed-dating.svg" alt="Hot Take logo" />
                        <span className="mock-app-title gradient-text">Hot Take</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>1.0 (3)</span>
                      </div>
                      
                      <div className="mock-user-card">
                        <div className="mock-avatar-container">
                          <div className="mock-pulse-ring"></div>
                          <div className="mock-avatar">😜</div>
                        </div>
                        <div>
                          <h3 className="mock-user-name">Sarah, 24</h3>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Match: 94% Hot Vibe</p>
                        </div>
                        <div className="mock-hottake-bubble">
                          Pineapple belongs on pizza, and anyone who disagrees has never experienced culinary perfection.
                        </div>
                      </div>

                      <button className="mock-action-btn">Start Speed Dating</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ─── INTERACTIVE PREVIEWER ─── */}
            <section className="previewer-section" id="previewer">
              <div className="container">
                <div className="section-header">
                  <span className="section-label">Interactive Experience</span>
                  <h2 className="section-title">Is your hot take actually hot?</h2>
                  <p>Cast your vote on the community's favorite controversial opinions and see how you match up against the rest of the world.</p>
                </div>

                <div className="previewer-tabs">
                  {HOT_TAKES_DATA.map(item => (
                    <button 
                      key={item.id}
                      onClick={() => setActiveTabId(item.id)}
                      className={`previewer-tab ${activeTabId === item.id ? 'active' : ''}`}
                    >
                      {item.category}
                    </button>
                  ))}
                </div>

                <div className="previewer-card-container">
                  <div className="previewer-card glass-card">
                    <span className="previewer-category">{activeHotTake.category}</span>
                    <p className="previewer-hottake">“{activeHotTake.question}”</p>
                    
                    {!userVote ? (
                      <div className="previewer-actions">
                        <button onClick={() => handleVote('hot')} className="previewer-vote-btn btn-hot">
                          <Flame size={18} /> Hot (Agree)
                        </button>
                        <button onClick={() => handleVote('cold')} className="previewer-vote-btn btn-cold">
                          ❄️ Cold (Disagree)
                        </button>
                      </div>
                    ) : (
                      <div className="vote-results">
                        <h4 className="results-header">Community Verdict</h4>
                        <div className="results-bar-container">
                          <div 
                            className="results-bar-hot" 
                            style={{ width: `${currentPercentages.hot}%` }}
                          >
                            💘 {currentPercentages.hot}% Hot
                          </div>
                          <div className="results-bar-cold">
                            {currentPercentages.cold}% Cold ❄️
                          </div>
                        </div>
                        <p className="results-explanation">
                          You voted <strong>{userVote === 'hot' ? 'Hot (Agree)' : 'Cold (Disagree)'}</strong>! On Hot Take, we use opinions like this to match you live on video.
                        </p>
                        <button onClick={handleResetVote} className="btn-reset-preview">
                          <RefreshCw size={12} style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }} /> Change Vote
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* ─── FEATURES SECTION ─── */}
            <section className="features-section" id="features">
              <div className="container">
                <div className="section-header">
                  <span className="section-label">How It Works</span>
                  <h2 className="section-title">Designed for Real Connection</h2>
                  <p>Skip the artificial text messages. Get straight to experiencing actual human personality and chemistry.</p>
                </div>

                <div className="features-grid">
                  <div className="feature-card glass-card">
                    <div className="feature-icon-wrapper">
                      <Flame size={24} />
                    </div>
                    <h3 className="feature-title">1. Share Your Take</h3>
                    <p className="feature-description">
                      Write your defining Hot Take directly into your profile. It can be a funny food opinion, a movie critique, or a lighthearted dating rule.
                    </p>
                  </div>

                  <div className="feature-card glass-card">
                    <div className="feature-icon-wrapper">
                      <Video size={24} />
                    </div>
                    <h3 className="feature-title">2. Live Speed Dating</h3>
                    <p className="feature-description">
                      Enter the matchmaking queue. Our system connects you in under a minute with other users for a private, live 3-minute video conversation.
                    </p>
                  </div>

                  <div className="feature-card glass-card">
                    <div className="feature-icon-wrapper">
                      <Heart size={24} />
                    </div>
                    <h3 className="feature-title">3. Match & Message</h3>
                    <p className="feature-description">
                      Felt a spark during your date? Tap Match! If the feeling is mutual, you instantly unlock permanent text chat messaging to plan a real-world meet.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ─── SUPPORT & FAQ SECTION ─── */}
            <section className="support-section" id="support">
              <div className="container">
                <div className="section-header">
                  <span className="section-label">Support Center</span>
                  <h2 className="section-title">Frequently Asked Questions</h2>
                  <p>Have questions about features, account management, privacy or safety? We are here to help.</p>
                </div>

                <div className="faq-list">
                  {FAQ_DATA.map((item, index) => {
                    const isExpanded = expandedFaqIndex === index;
                    return (
                      <div 
                        key={index} 
                        className={`faq-item ${isExpanded ? 'expanded' : ''}`}
                      >
                        <button 
                          onClick={() => setExpandedFaqIndex(isExpanded ? null : index)}
                          className="faq-trigger"
                        >
                          <span>{item.question}</span>
                          <ChevronDown size={18} className="faq-chevron" />
                        </button>
                        {isExpanded && (
                          <div className="faq-content">
                            <p>{item.answer}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
                    Can't find the answer you are looking for? Reach out to support directly at:
                  </p>
                  <a 
                    href="mailto:support@hottakedate.com" 
                    className="gradient-text" 
                    style={{ fontWeight: '700', fontSize: '18px', display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}
                  >
                    <Mail size={18} /> support@hottakedate.com
                  </a>
                </div>
              </div>
            </section>
          </>
        ) : (
          /* ─── PRIVACY POLICY VIEW ─── */
          <section className="legal-section">
            <div className="container">
              <button 
                onClick={() => setCurrentView('home')} 
                className="btn-secondary" 
                style={{ marginBottom: '32px', padding: '10px 20px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <ArrowLeft size={16} /> Back to Home
              </button>
              
              <div className="legal-card glass-card">
                <h1 className="legal-title">Privacy Policy</h1>
                <p className="legal-meta">Last Updated: May 8, 2026</p>

                <div className="legal-block">
                  <h2>1. Introduction</h2>
                  <p>
                    Welcome to Hot Take, operated by Monarch Labs Inc. (\"we,\" \"our,\" or \"us\"). We value your privacy and are committed to protecting your personal data. This Privacy Policy outlines how we collect, use, store, and share information when you use the Hot Take mobile application and our website hottakedate.com.
                  </p>
                </div>

                <div className="legal-block">
                  <h2>2. Information We Collect</h2>
                  <p>To provide our live speed-dating matching features, we collect the following data types:</p>
                  <ul>
                    <li><strong>Account Credentials:</strong> Email addresses and secure passwords collected via Supabase Auth for sign-up and login.</li>
                    <li><strong>Profile Metadata:</strong> Your name, age, gender preference, and your custom written "Hot Take" statement.</li>
                    <li><strong>Media Access (iOS Permissions):</strong> Active camera and microphone permissions are requested solely to enable your live 3-minute speed dating video feeds. We **never** record, store, or transmit these video and audio files to our servers. All media is streamed live, point-to-point, via secure WebRTC.</li>
                    <li><strong>Interaction Records:</strong> Temporary matchmaking queue logs and match history (e.g., if you and your date mutually chose to match).</li>
                  </ul>
                </div>

                <div className="legal-block">
                  <h2>3. How We Use Your Information</h2>
                  <p>We use the collected information for the following administrative purposes:</p>
                  <ul>
                    <li>To authenticate your identity and keep your profile secure.</li>
                    <li>To run matchmaking algorithms matching you on live speed dates based on your Hot Take.</li>
                    <li>To establish live real-time video/audio connections utilizing encrypted channels (LiveKit Cloud).</li>
                    <li>To maintain account security and offer user support.</li>
                  </ul>
                </div>

                <div className="legal-block">
                  <h2>4. Data Security and Privacy</h2>
                  <p>
                    We implement industry-standard administrative and technical security measures to protect your data. All live speed-dating audio/video channels are encrypted using peer-to-peer security. Since we do not record speed dates, there is no video history stored on our servers.
                  </p>
                </div>

                <div className="legal-block">
                  <h2>5. Your Rights: Permanent Account Deletion</h2>
                  <p>
                    Under Apple's requirements and privacy laws, you have full control over your data. You can permanently delete your profile and credentials at any time. Inside the iOS application, go to your **Profile Tab**, tap **Delete account**, and confirm. Doing so instantly:
                  </p>
                  <ul>
                    <li>Erases your Supabase authentication credentials.</li>
                    <li>Permanently deletes your profile records, names, avatar links, and matching logs.</li>
                    <li>Clears your match and chat histories from all servers.</li>
                  </ul>
                  <p>This action is immediate, permanent, and cannot be undone.</p>
                </div>

                <div className="legal-block">
                  <h2>6. Contact Us</h2>
                  <p>
                    If you have questions regarding this privacy statement, user data deletion, or general practices, please contact us at:
                  </p>
                  <p style={{ fontWeight: '600', color: 'var(--color-accent)' }}>
                    support@hottakedate.com
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ─── APP FOOTER ─── */}
      <footer className="app-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <img className="logo-icon" src="/speed-dating.svg" alt="Hot Take logo" />
                <span className="logo-text">Hot Take</span>
              </div>
              <p className="footer-motto">
                Skip the swiping, embrace the chemistry. Live 3-minute speed dating for genuine human connection.
              </p>
            </div>
            
            <div className="footer-links-column">
              <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-primary)', marginBottom: '16px' }}>Legal & Help</h4>
              <a 
                href="#home" 
                onClick={(e) => { e.preventDefault(); setCurrentView('home'); }} 
                className="footer-link"
              >
                Home
              </a>
              <a 
                href="#support" 
                onClick={(e) => { if (currentView !== 'home') { e.preventDefault(); setCurrentView('home'); } setTimeout(() => document.getElementById('support')?.scrollIntoView({ behavior: 'smooth' }), 100); }} 
                className="footer-link"
              >
                Support / FAQ
              </a>
              <a 
                href="#privacy" 
                onClick={(e) => { e.preventDefault(); setCurrentView('privacy'); }} 
                className="footer-link"
              >
                Privacy Policy
              </a>
              <a href="mailto:support@hottakedate.com" className="footer-link">
                Contact Support
              </a>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2026 Monarch Labs Inc. All rights reserved.</p>
            <p style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={14} /> Secured with WebRTC Encryption
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
