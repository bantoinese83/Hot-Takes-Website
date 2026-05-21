import { MapPin, Users } from 'lucide-react';
import { DottedMap } from '@/components/magicui/dotted-map';
import { ShineBorder } from '@/components/magicui/shine-border';
import { useWaitlistMapPins } from '../hooks/useWaitlistMapPins';
import type { WaitlistMapPin } from '../lib/waitlistMapPins';
import { Reveal } from './Reveal';

export function NetworkDottedMapSection() {
  const { pins, total, live, error, loaded, hasPins } = useWaitlistMapPins();

  const footerCopy = !loaded
    ? 'Loading waitlist map…'
    : hasPins
      ? `${total.toLocaleString()} ${total === 1 ? 'person' : 'people'} on the waitlist · ${pins.length} ${pins.length === 1 ? 'area' : 'areas'} on the map`
      : 'Join the waitlist — your area lights up here (coarse ~0.1° buckets, never exact addresses)';

  return (
    <section className="network-map-section" id="network" aria-labelledby="network-map-heading">
      <div className="container">
        <Reveal>
          <div className="section-header">
            <span className="section-label">Privacy-safe geography</span>
            <h2 id="network-map-heading" className="section-title">
              Waitlist signups lighting up the map
            </h2>
            <p className="section-lead network-map-lead">
              Every join drops a coarse pin — same ~0.1° buckets we use for matching, not street-level tracking.
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <div className="relative overflow-hidden rounded-2xl border border-[rgba(255,84,78,0.22)] bg-[#1a1c1f] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
            <ShineBorder
              shineColor={['#ff544e', '#83cfff', '#ff7a75']}
              duration={18}
              borderWidth={1}
            />
            <div className="network-map-radial" aria-hidden />
            <div className="network-map-inner">
              <DottedMap<WaitlistMapPin>
                width={320}
                height={160}
                mapSamples={5500}
                markers={pins}
                dotRadius={0.14}
                dotColor="rgba(204, 161, 157, 0.45)"
                markerColor="#ff544e"
                pulse
              />
            </div>
            <div className="network-map-footer">
              {live && hasPins ? <span className="network-map-live-dot" aria-hidden /> : null}
              <MapPin size={14} aria-hidden />
              <span>{footerCopy}</span>
              {hasPins ? (
                <span className="network-map-footer-stat">
                  <Users size={14} aria-hidden />
                  {live ? 'Live' : 'Updated'}
                </span>
              ) : null}
            </div>
            {error ? <p className="network-map-error">{error}</p> : null}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
