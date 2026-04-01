import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TicketCard from '../components/TicketCard';
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
  console.log('🔄 TicketsPage render');  // ← ici

  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentName] = useState(
    `${getFirstName() || ''} ${getLastName() || ''}`.trim()
  );

  useEffect(() => {
    console.log('⚡ useEffect déclenché');  // ← et ici
    
    if (!isLoggedIn()) {
      navigate('/', { replace: true });
      return;
    }

    async function loadTickets() {
      console.log('📡 appel API');  // ← et ici
      try {
        const data = await getUserTickets();
        console.log('✅ data reçue', data);  // ← et ici
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
              onClick={() => navigate('/')}
              className="mt-6 px-6 py-3 bg-[#2e7d32] text-white rounded text-sm uppercase tracking-wider font-semibold hover:bg-[#1b5e20] transition-colors"
            >
              Acheter un ticket
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticketCode={ticket.ticket_code}
                holderName={studentName}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}