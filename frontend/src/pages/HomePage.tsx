import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import InclusSection from '../components/InclusSection';
import FixedHiker from '../components/FixedHiker';
import Footer from '../components/Footer';
import '../styles/rando.css';

export default function HomePage() {
  return (
    <div className="font-outfit bg-white text-[#080f1e] leading-relaxed">
      <Navbar />
      <Hero />
      <InclusSection />
      <FixedHiker />
      <Footer />
    </div>
  );
}
