import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn, logout } from '../api/session';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
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
    navigate('/');
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[5%] bg-white border-b border-black/[0.07] shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-all duration-300 ${
        scrolled ? 'h-[62px]' : 'h-[90px]'
      }`}
    >
      <img 
        src="/images/logo.png" 
        alt="Logo Randonnée des 11" 
        className={`object-contain cursor-pointer transition-all duration-300 ${
          scrolled ? 'h-12' : 'h-14'
        }`}
        onClick={() => navigate('/randonnée')}
      />
      <div className="flex items-center gap-4">
        {isLoggedIn() && (
          <button
            onClick={() => navigate('/mes-billets')}
            className="font-outfit text-xs font-semibold text-[#080f1e] no-underline uppercase tracking-[0.18em] py-2.5 px-5 bg-[#f5f8f5] rounded-sm transition-all duration-250 hover:bg-[#e8f0e8]"
          >
            🎫 Mes Billets
          </button>
        )}
        <a
          href="/randonnée#paiement"
          className="font-outfit text-xs font-semibold text-[#2e7d32] no-underline uppercase tracking-[0.18em] py-2.5 px-5 border border-[#2e7d32] rounded-sm transition-all duration-250 hover:bg-[#2e7d32] hover:text-white"
        >
          Billetterie
        </a>
        {isLoggedIn() && (
          <button
            onClick={handleLogout}
            className="font-outfit text-xs font-semibold text-red-600 no-underline uppercase tracking-[0.18em] py-2.5 px-5 border border-red-200 rounded-sm transition-all duration-250 hover:bg-red-50"
          >
            Déconnexion
          </button>
        )}
      </div>
    </nav>
  );
}