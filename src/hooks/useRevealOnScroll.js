import { useEffect, useRef } from 'react';

export function useRevealOnScroll(threshold = 0.12) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    const targets = el.querySelectorAll('.reveal');
    targets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
