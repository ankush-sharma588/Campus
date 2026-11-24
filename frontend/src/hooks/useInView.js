import { useEffect, useRef, useState } from 'react';

const DEFAULT_OPTIONS = Object.freeze({
  threshold: 0.15,
  rootMargin: '0px 0px -8% 0px',
});

// Fires once when the element enters the viewport (without scroll listeners).
export default function useInView(options = DEFAULT_OPTIONS) {
  const ref = useRef(null);
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined');
  const { root, rootMargin, threshold } = options;

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, { root, rootMargin, threshold });

    observer.observe(element);
    return () => observer.disconnect();
  }, [root, rootMargin, threshold]);

  return [ref, inView];
}
