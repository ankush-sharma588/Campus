import { useRef, useState } from 'react';
import HeroImg from '../../assets/heroImg.jpg';
import { useNavigate } from 'react-router-dom';
import { SplitText, Magnetic } from './Motion';

function LandingHeroPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const layer = useRef(null);
  const raf = useRef(0);

  const handleCreateAccount = () => {
    navigate('/student/signup', email.trim() ? { state: { prefillEmail: email } } : undefined);
  };
  const handleScrollAbout = () => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });

  // subtle mouse parallax on the glow blobs (transform only, rAF throttled)
  const onMove = (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 40;
    const y = (e.clientY / window.innerHeight - 0.5) * 40;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      if (layer.current) layer.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  };

  return (
    <section
      id="home"
      onMouseMove={onMove}
      className="relative min-h-[92vh] w-full flex items-center px-6 md:px-20 bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: `url(${HeroImg})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/90 via-indigo-950/60 to-transparent" />
      <div ref={layer} className="absolute inset-0 pointer-events-none transition-transform duration-300 ease-out">
        <div className="float-a absolute -top-20 right-10 w-80 h-80 rounded-full bg-teal-400/30 blur-3xl" />
        <div className="float-b absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-amber-400/20 blur-3xl" />
      </div>

      <div className="relative z-20 max-w-4xl text-left py-28">
        <p className="fade-up text-amber-300 tracking-[.3em] uppercase text-xs md:text-sm font-semibold mb-5" style={{ animationDelay: '100ms' }}>
          Campus placement portal
        </p>
        <h1 className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] playfair">
          <SplitText text="Land your first offer" delay={200} />
          <br />
          <span className="bg-gradient-to-r from-teal-300 via-indigo-300 to-amber-300 text-transparent bg-clip-text">
            <SplitText text="with PlaceHub" delay={550} />
          </span>
        </h1>

        <p className="fade-up mt-6 text-indigo-100/80 text-lg sm:text-xl font-light max-w-xl" style={{ animationDelay: '900ms' }}>
          Browse openings, apply in a click and follow every stage of your placement journey from one dashboard.
        </p>

        <div className="fade-up mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3" style={{ animationDelay: '1100ms' }}>
          <input
            type="email"
            className="px-5 py-3 w-full sm:w-96 rounded-full shadow-md focus:outline-none focus:ring-4 focus:ring-amber-300 text-black transition duration-300"
            placeholder="Enter your email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Magnetic>
            <button
              type="button"
              className="btn-fill bg-amber-400 text-indigo-950 px-7 py-3 rounded-full font-semibold shadow-lg"
              onClick={handleCreateAccount}
            >
              Create Account
            </button>
          </Magnetic>
        </div>

        <button
          className="fade-up link-line mt-10 inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
          style={{ animationDelay: '1300ms' }}
          onClick={handleScrollAbout}
        >
          See how it works <i className="fa-solid fa-arrow-down bounce-soft" />
        </button>
      </div>
    </section>
  );
}

export default LandingHeroPage;
