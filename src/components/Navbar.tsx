import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../api/session';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/');
  };


  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-[5%] bg-white border-b border-black/[0.07] shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-all duration-300 ${
        scrolled ? 'h-[65px]' : 'h-[90px]'
      }`}
    >
      <Link to="/">
        <img 
          src="/images/logo.png" 
          alt="Logo Randonnée des 11" 
          className={`object-contain transition-all duration-300 ${
            scrolled ? 'h-10 md:h-12' : 'h-12 md:h-16'
          }`}
        />
      </Link>

      <div className="hidden md:flex items-center gap-6">
        <Link
          to="/tickets"
          className="font-outfit text-xs font-bold text-gray-700 no-underline uppercase tracking-widest py-3 px-6 border-2 border-gray-200 rounded-md transition-all duration-300 hover:border-[#2e7d32] hover:text-[#2e7d32]"
        >
          Récupérer mon ticket
        </Link>
        <a
          href="#paiement"
          className="font-outfit text-xs font-semibold text-[#2e7d32] no-underline uppercase tracking-[0.18em] py-2.5 px-5 border border-[#2e7d32] rounded-sm transition-all duration-250 hover:bg-[#2e7d32] hover:text-white"
        >
          Acheter votre billet
        </a>
        
        <button
          onClick={handleLogout}
          className="font-outfit text-xs font-bold text-red-600 uppercase tracking-widest hover:underline ml-2"
        >
          Déconnexion
        </button>
      </div>

      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 focus:outline-none z-[110]"
      >
        <span className={`h-0.5 w-6 bg-[#2e7d32] transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
        <span className={`h-0.5 w-6 bg-[#2e7d32] transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
        <span className={`h-0.5 w-6 bg-[#2e7d32] transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
      </button>

      <div className={`fixed inset-0 w-full h-screen bg-white transition-all duration-500 ease-in-out md:hidden flex flex-col items-center justify-center p-8 gap-6 ${
        isMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <a
          href="#paiement"
          onClick={() => setIsMenuOpen(false)}
          className="w-full text-center font-bold text-white bg-[#2e7d32] py-5 rounded-xl uppercase text-sm tracking-widest shadow-md"
        >
          Acheter votre billet
        </a>
        <Link
          to="/tickets"
          onClick={() => setIsMenuOpen(false)}
          className="w-full text-center font-bold text-gray-700 border-2 border-gray-200 py-5 rounded-xl uppercase text-sm tracking-widest"
        >
          Récupérer mon ticket
        </Link>

        <button
          onClick={handleLogout}
          className="w-full text-center font-bold text-red-500 py-4 uppercase text-xs tracking-[0.2em] mt-4"
        >
          Se déconnecter
        </button>
      </div>
    </nav>
  );
}