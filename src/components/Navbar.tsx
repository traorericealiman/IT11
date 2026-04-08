import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Import important

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-[5%] bg-white border-b border-black/[0.07] shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-all duration-300 ${
        scrolled ? 'h-[65px]' : 'h-[90px]'
      }`}
    >
      {/* Logo : On l'entoure aussi d'un Link pour revenir à l'accueil */}
      <Link to="/">
        <img 
          src="/images/logo.png" 
          alt="Logo Randonnée des 11" 
          className={`object-contain transition-all duration-300 ${
            scrolled ? 'h-10 md:h-12' : 'h-12 md:h-16'
          }`}
        />
      </Link>
    </nav>
  );
}