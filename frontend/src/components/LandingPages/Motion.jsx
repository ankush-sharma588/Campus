import React, { useEffect, useRef, useState } from 'react';
import useInView from '../../hooks/useInView';

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Fade + rise on scroll */
export function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }) {
  const [ref, inView] = useInView();
  return (
    <Tag ref={ref} className={`reveal ${inView ? 'reveal-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

/* Word-by-word masked text reveal (headline style) */
export function SplitText({ text, className = '', delay = 0, step = 70 }) {
  const [ref, inView] = useInView({ threshold: 0.3 });
  return (
    <span ref={ref} className={className} aria-label={text}>
      {text.split(' ').map((w, i) => (
        <span key={i} className="split-mask" aria-hidden="true">
          <span className={`split-word ${inView ? 'split-in' : ''}`} style={{ transitionDelay: `${delay + i * step}ms` }}>{w}&nbsp;</span>
        </span>
      ))}
    </span>
  );
}

/* Button/element that gently follows the cursor */
export function Magnetic({ children, strength = 0.25, className = '' }) {
  const ref = useRef(null);
  const raf = useRef(0);
  const move = (e) => {
    if (reduced()) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => { ref.current.style.transform = `translate3d(${x}px,${y}px,0)`; });
  };
  const leave = () => { cancelAnimationFrame(raf.current); ref.current.style.transform = 'translate3d(0,0,0)'; };
  return (
    <div ref={ref} onMouseMove={move} onMouseLeave={leave} className={`magnetic ${className}`}>{children}</div>
  );
}

/* 3D tilt card with moving glare */
export function Tilt({ children, className = '' }) {
  const ref = useRef(null);
  const raf = useRef(0);
  const move = (e) => {
    if (reduced()) return;
    const el = ref.current, r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(800px) rotateX(${(0.5 - py) * 8}deg) rotateY(${(px - 0.5) * 10}deg) translateY(-6px)`;
      el.style.setProperty('--gx', `${px * 100}%`); el.style.setProperty('--gy', `${py * 100}%`);
    });
  };
  const leave = () => { cancelAnimationFrame(raf.current); ref.current.style.transform = ''; };
  return <div ref={ref} onMouseMove={move} onMouseLeave={leave} className={`tilt ${className}`}>{children}</div>;
}

/* Animated number */
export function CountUp({ to, suffix = '', duration = 1600 }) {
  const [ref, inView] = useInView({ threshold: 0.5 });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (reduced()) { setVal(to); return; }
    let start; let id;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);
      setVal(Math.round(to * (1 - Math.pow(1 - p, 4))));
      if (p < 1) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [inView]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* Infinite marquee */
export function Marquee({ items, reverse = false }) {
  const row = [...items, ...items];
  return (
    <div className="marquee">
      <div className={`marquee-track ${reverse ? 'marquee-rev' : ''}`}>
        {row.map((t, i) => (
          <span key={i} className="marquee-item">{t}<i className="marquee-dot" /></span>
        ))}
      </div>
    </div>
  );
}

/* Top scroll progress bar (single rAF-throttled listener) */
export function ScrollProgress() {
  const bar = useRef(null);
  useEffect(() => {
    let ticking = false;
    const update = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${h > 0 ? window.scrollY / h : 0})`;
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <div ref={bar} className="scroll-progress" />;
}
