import { useEffect } from 'react';

export function useParallax() {
  useEffect(() => {
    function onScroll() {
      const sy = window.scrollY;

      const heroContent = document.querySelector('.hero-content');
      if (heroContent) {
        heroContent.style.transform = `translateY(${sy * 0.3}px)`;
        heroContent.style.opacity = String(Math.max(0, 1 - sy / 500));
      }

      const aboutImg = document.querySelector('.about-image img');
      if (aboutImg) {
        const rect = aboutImg.closest('.about-image').getBoundingClientRect();
        const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * 0.1;
        aboutImg.style.transform = `translateY(${offset}px) scale(1.08)`;
      }

      const atImg = document.querySelector('.attractions-right img');
      if (atImg) {
        const rect = atImg.parentElement.getBoundingClientRect();
        const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * 0.08;
        atImg.style.transform = `translateY(${offset}px) scale(1.08)`;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
}
