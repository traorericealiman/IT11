import { useEffect, useRef, useState } from 'react';

/**
 * Hook qui retourne une ref et un booléen `visible`
 * dès que l'élément entre dans le viewport.
 * L'observer est déconnecté après la première apparition.
 */
export function useFadeInOnScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}
