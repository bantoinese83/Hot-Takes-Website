import { Reveal } from './Reveal';

const STOCK = [
  {
    src: '/marketing/hot-take-stock-hero-video-date.png',
    alt: 'Person on a live video date with coral-lit phone glow',
    caption: 'Live on camera',
    tag: 'Dating tab',
  },
  {
    src: '/marketing/hot-take-stock-queue-pulse.png',
    alt: 'Abstract coral pulse rings representing the matching queue',
    caption: 'In the line',
    tag: 'Queue',
  },
  {
    src: '/marketing/hot-take-stock-live-split-date.png',
    alt: 'Split video frames showing two people on a short live date',
    caption: '3-minute date',
    tag: 'Video',
  },
  {
    src: '/marketing/hot-take-stock-join-the-line.png',
    alt: 'Hands holding phone in a moody cafe, ready to join the line',
    caption: 'Join the line',
    tag: 'Waitlist',
  },
] as const;

export function MarketingStockGallery() {
  return (
    <section className="stock-gallery-section" id="app-preview" aria-labelledby="stock-gallery-heading">
      <div className="container">
        <Reveal>
          <div className="section-header">
            <span className="section-label">On iOS</span>
            <h2 id="stock-gallery-heading" className="section-title">
              Same energy as the app
            </h2>
            <p className="section-lead stock-gallery-lead">
              Dark UI, coral accents, live video — built for Takes, not swipe decks.
            </p>
          </div>
        </Reveal>

        <div className="stock-gallery-grid">
          {STOCK.map((item, i) => (
            <Reveal key={item.src} delayMs={i * 60} className="stock-gallery-reveal">
              <figure className="stock-gallery-card glass-card">
                <div className="stock-gallery-media">
                  <img src={item.src} alt={item.alt} loading="lazy" decoding="async" />
                  <span className="stock-gallery-tag">{item.tag}</span>
                </div>
                <figcaption className="stock-gallery-caption">{item.caption}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
