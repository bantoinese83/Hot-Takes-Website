import { useEffect, useState } from 'react';
import { fetchWaitlistMapPins, subscribeWaitlistMapPins, totalFromPins, type WaitlistMapPin } from '../lib/waitlistMapPins';

export function useWaitlistMapPins() {
  const [pins, setPins] = useState<WaitlistMapPin[]>([]);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLive(true);
    return subscribeWaitlistMapPins(
      (next) => {
        setPins(next);
        setLoaded(true);
        setError(null);
      },
      (msg) => {
        setError(msg);
        setLoaded(true);
        void fetchWaitlistMapPins().then(setPins).catch(() => undefined);
      },
    );
  }, []);

  return {
    pins,
    total: totalFromPins(pins),
    live,
    error,
    loaded,
    hasPins: pins.length > 0,
  };
}
