import React, { useEffect, useState } from 'react';
import Logo from '../../assets/CPMS.png';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';

function LandingNavbar() {
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = React.useRef(0);
  const [buttonSize, setButtonSize] = useState('lg');
  const [logoText, setLogoText] = useState('PlaceHub');

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 80);
      setHidden(y > lastY.current && y > 300);
      lastY.current = y;
    };

    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= 600) {
        setButtonSize('sm');
        setLogoText('PlaceHub');
      } else if (width <= 768) {
        setButtonSize('md');
        setLogoText('PlaceHub');
      } else {
        setButtonSize('lg');
        setLogoText('PlaceHub');
      }
    };

    handleResize();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <header
      className={`w-full z-50 fixed top-0 transition-all duration-500 ease-out ${hidden ? '-translate-y-full' : 'translate-y-0'} ${isScrolled ? 'backdrop-blur-md bg-white/70 shadow-md' : 'bg-transparent'}`}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center py-3 px-4">
        {/* Logo Section */}
        <div
          className="flex items-center max-md:gap-2 md:gap-4 cursor-pointer transition-transform hover:scale-105 duration-150"
          onClick={() => navigate('/')}
        >
          <img
            src={Logo}
            alt="PlaceHub Logo"
            className="rounded-2xl w-12 h-12 md:w-14 md:h-14 shadow-sm"
          />
          <h1 className={`text-2xl md:text-3xl font-bold playfair transition-colors duration-300 ${isScrolled ? 'text-indigo-900' : 'text-white'}`}>
            {logoText}
          </h1>
        </div>

        {/* Button Section */}
        <div className="flex max-md:gap-1 md:gap-3 items-center">
          <Button
            variant={isScrolled ? "outline-primary" : "outline-light"}
            size={buttonSize}
            className="transition-all hover:scale-105 hover:shadow-md px-3 md:w-32"
            onClick={() => navigate('/student/login')}
          >
            Login
          </Button>

          <Button
            variant="success"
            size={buttonSize}
            className="transition-all hover:scale-105 hover:shadow-md px-3 md:w-32"
            onClick={() => navigate('/student/signup')}
          >
            Sign Up
          </Button>
        </div>
      </div>
    </header>
  );
}

export default LandingNavbar;
