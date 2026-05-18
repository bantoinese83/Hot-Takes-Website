import { useEffect, useState } from 'react';

export function useAnimatedNumber(target: number, durationMs = 650) {
  const [display, setDisplay] = useState(() => target);

  useEffect(() => {
    const from = display;
    const delta = target - from;
    if (delta === 0) return;

    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(from + delta * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate toward target
  }, [target, durationMs]);

  return display;
}
