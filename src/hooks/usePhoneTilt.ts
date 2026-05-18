import { useCallback, useRef, useState } from 'react';

export function usePhoneTilt(maxDeg = 7) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState('perspective(900px) rotateX(0deg) rotateY(0deg)');

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const rotateY = x * maxDeg * 2;
      const rotateX = -y * maxDeg * 2;
      setTransform(`perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`);
    },
    [maxDeg],
  );

  const onLeave = useCallback(() => {
    setTransform('perspective(900px) rotateX(0deg) rotateY(0deg)');
  }, []);

  return { wrapRef, transform, onMove, onLeave };
}
