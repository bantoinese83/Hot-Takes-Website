import { Flame, Shield, Video, Zap } from 'lucide-react';
import { Marquee } from '@/components/magicui/marquee';
import { SITE } from '../siteCopy';

const ITEMS = [
  { icon: Video, text: `${SITE.dateMinutes}-minute live video dates` },
  { icon: Flame, text: 'Hot Takes, not swipe decks' },
  { icon: Shield, text: 'Encrypted WebRTC (LiveKit)' },
  { icon: Zap, text: 'Mutual Match → chat' },
  { icon: Video, text: 'No recordings on our servers' },
  { icon: Flame, text: 'Community vote prompts' },
] as const;

export function MarketingMarquee() {
  return (
    <section className="marketing-marquee-section" aria-label="Product highlights">
      <Marquee pauseOnHover className="marketing-marquee [--duration:32s]">
        {ITEMS.map((item) => (
          <span key={item.text} className="marketing-marquee-pill">
            <item.icon size={16} aria-hidden />
            {item.text}
          </span>
        ))}
      </Marquee>
    </section>
  );
}
