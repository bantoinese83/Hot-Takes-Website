import { Lock, MapPin, Timer, Users } from 'lucide-react';
import { TRUST_PILLARS } from '../siteCopy';
import { Reveal } from './Reveal';

const ICONS = [Users, MapPin, Timer, Lock] as const;

export function TrustStrip() {
  return (
    <section className="trust-strip" aria-labelledby="trust-heading">
      <div className="container">
        <Reveal>
          <div className="trust-strip-header">
            <span className="section-label">Built for real dates</span>
            <h2 id="trust-heading" className="section-title trust-strip-title">
              Less noise. More chemistry.
            </h2>
          </div>
        </Reveal>
        <div className="trust-grid">
          {TRUST_PILLARS.map((item, i) => {
            const Icon = ICONS[i] ?? Users;
            return (
              <Reveal key={item.title} delayMs={i * 50}>
                <article className="trust-card glass-card">
                  <span className="trust-card-icon" aria-hidden>
                    <Icon size={20} strokeWidth={2.25} />
                  </span>
                  <h3 className="trust-card-title">{item.title}</h3>
                  <p className="trust-card-body">{item.body}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
