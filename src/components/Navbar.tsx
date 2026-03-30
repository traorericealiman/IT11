import { useEffect, useState } from 'react';

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
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[5%] bg-white border-b border-black/[0.07] shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-all duration-300 ${
        scrolled ? 'h-[62px]' : 'h-[90px]'
      }`}
    >
      <img 
        src="/images/logo.png" 
        alt="Logo Randonnée des 11" 
        className={`object-contain transition-all duration-300 ${
          scrolled ? 'h-12' : 'h-14'
        }`}
      />
      <div>
        <a
          href="#paiement"
          className="font-outfit text-xs font-semibold text-[#2e7d32] no-underline uppercase tracking-[0.18em] py-2.5 px-5 border border-[#2e7d32] rounded-sm transition-all duration-250 hover:bg-[#2e7d32] hover:text-white"
        >
          Billetterie
        </a>
      </div>
    </nav>
  );
}