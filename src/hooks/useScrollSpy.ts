import { useEffect, useState } from 'react';

export function useScrollSpy(sectionIds: string[], enabled = true) {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? '');

  useEffect(() => {
    if (!enabled) return;

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null);

    if (sections.length === 0) return;

    const onScroll = () => {
      const offset = window.scrollY + 120;
      let current = sections[0].id;
      for (const section of sections) {
        if (section.offsetTop <= offset) {
          current = section.id;
        }
      }
      setActiveId(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [sectionIds, enabled]);

  return activeId;
}
