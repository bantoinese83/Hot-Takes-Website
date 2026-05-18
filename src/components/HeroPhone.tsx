import { MockDatingReadyScreen } from './MockDatingReadyScreen';
import { usePhoneTilt } from '../hooks/usePhoneTilt';
import { Signal, Wifi, Battery } from 'lucide-react';

export function HeroPhone() {
  const { wrapRef, transform, onMove, onLeave } = usePhoneTilt(6);

  return (
    <div
      className="mockup-container"
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className="phone-mockup" style={{ transform, transition: 'transform 0.15s ease-out' }}>
        <div className="phone-notch" aria-hidden />
        <div className="phone-screen">
          <div className="phone-status-bar">
            <span className="status-time">9:41</span>
            <div className="status-icons">
              <Signal size={12} strokeWidth={2.5} />
              <Wifi size={12} strokeWidth={2.5} />
              <Battery size={14} strokeWidth={2} />
            </div>
          </div>
          <MockDatingReadyScreen />
          <div className="phone-home-indicator" />
        </div>
      </div>
    </div>
  );
}
