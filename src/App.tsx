import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminDashboard from './components/dashboard';

function App() {
  return (
    <div className="font-outfit bg-slate-50 min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-12">
        <AdminDashboard />
      </main>
      <Footer />
    </div>
  );
}

export default App;