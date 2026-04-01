import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirstName, getLastName, isLoggedIn } from '../api/session';
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
  const hasFetched = useRef(false);

  const studentName = `${getFirstName() || ''} ${getLastName() || ''}`.trim();

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

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
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f8f5]">
      <Navbar />

      <main className="flex-1 py-12 px-[5%] max-w-[1200px] mx-auto w-full mt-16">
        <h1 className="font-garamond text-4xl sm:text-5xl font-light mb-12 text-[#080f1e] text-center">
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
              onClick={() => navigate('/randonnée')}
              className="mt-6 px-6 py-3 bg-[#2e7d32] text-white rounded text-sm uppercase tracking-wider font-semibold hover:bg-[#1b5e20] transition-colors"
            >
              Acheter un ticket
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white border border-[#dde8dd] rounded-lg p-6 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                {/* Infos ticket */}
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-[#f5f8f5] rounded-full flex items-center justify-center text-2xl">
                    🎫
                  </div>
                  <div>
                    <p className="font-semibold text-[#080f1e] text-lg">
                      {studentName}
                    </p>
                    <p className="text-[#8a92a6] text-sm font-mono mt-1">
                      N° {ticket.ticket_code.padStart(7, '0')}
                    </p>
                  </div>
                </div>

                {/* Bouton voir */}
                <button
                  onClick={() => navigate(`/mes-billets/${ticket.ticket_code}`)}
                  className="px-5 py-2.5 bg-[#2e7d32] text-white rounded text-sm uppercase tracking-wider font-semibold hover:bg-[#1b5e20] transition-colors whitespace-nowrap"
                >
                  Voir mon billet →
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}