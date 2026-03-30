import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Barcode from 'react-barcode';
import { isLoggedIn } from '../api/session';
import { getUserTickets } from '../api/tickets';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface Ticket {
  id: string;
  ticket_code: string;
  student_id: string;
  created_at: string;
}

export default function TicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/', { replace: true });
      return;
    }

    async function loadTickets() {
      try {
        const data = await getUserTickets();
        setTickets(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f8f5]">
      <Navbar />

      <main className="flex-1 py-20 px-[5%] max-w-[1200px] mx-auto w-full mt-16">
        <h1 className="font-garamond text-4xl sm:text-5xl font-light mb-12 text-[#080f1e]">
          Mes Billets
        </h1>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-[#8a92a6]">Chargement de vos billets...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded border border-red-200">
            <p>{error}</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white p-12 text-center rounded border border-[#dde8dd]">
            <p className="text-xl text-[#8a92a6] font-garamond">
              Vous n'avez pas encore de billet validé.
            </p>
            <button
              onClick={() => navigate('/randonnée#paiement')}
              className="mt-6 px-6 py-3 bg-[#2e7d32] text-white rounded text-sm uppercase tracking-wider font-semibold hover:bg-[#1b5e20] transition-colors"
            >
              Acheter un ticket
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded overflow-hidden shadow-sm hover:shadow-md transition-shadow relative"
                style={{
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                {/* Bandeau vert design */}
                <div className="h-4 bg-[#2e7d32] w-full" />
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8a92a6]">
                        Randonnée des 11
                      </p>
                      <h3 className="font-garamond text-2xl mt-1 text-[#080f1e]">
                        Billet d'entrée
                      </h3>
                    </div>
                    <span
                      className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-green-100 text-green-700"
                    >
                      Valide
                    </span>
                  </div>

                  {/* Barcode */}
                  <div className="flex justify-center my-6 overflow-hidden">
                    <div className="p-2 border border-dashed border-[#c8d8c8] rounded bg-white">
                      <Barcode
                        value={ticket.ticket_code}
                        width={2}
                        height={60}
                        displayValue={false}
                        background="transparent"
                        lineColor="#080f1e"
                      />
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-dashed border-[#dde8dd] text-center">
                    <p className="text-[10px] uppercase font-bold text-[#8a92a6] tracking-widest mb-1">
                      Code de sécurité
                    </p>
                    <p className="font-mono text-xl tracking-widest text-[#080f1e] font-semibold">
                      {ticket.ticket_code}
                    </p>
                  </div>
                </div>

                {/* Petits cercles pour faire l'effet ticket coupé */}
                <div className="absolute top-1/2 -ml-3 left-0 w-6 h-6 bg-[#f5f8f5] rounded-full" />
                <div className="absolute top-1/2 -mr-3 right-0 w-6 h-6 bg-[#f5f8f5] rounded-full" />
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
