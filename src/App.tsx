import Navbar from './components/Navbar';
import Hero from './components/Hero';
import InclusSection from './components/InclusSection';
import Footer from './components/Footer';
import FixedHiker from './components/FixedHiker';
import './styles/rando.css';

function App() {
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

export default App;
