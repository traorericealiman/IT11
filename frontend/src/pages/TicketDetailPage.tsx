import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toJpeg, toPng } from 'html-to-image';
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

export default function TicketDetailPage() {
  const { ticketCode } = useParams<{ ticketCode: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const hasFetched = useRef(false);
  const ticketRef = useRef<HTMLDivElement>(null);  // ← ref ici

  const studentName = `${getFirstName() || ''} ${getLastName() || ''}`.trim();
  const formattedCode = ticketCode?.padStart(7, "0") || "";

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    if (!isLoggedIn()) {
      navigate('/', { replace: true });
      return;
    }

    async function loadTicket() {
      try {
        const data = await getUserTickets();
        const found = data.find((t: Ticket) => t.ticket_code === ticketCode);
        if (!found) {
          setError('Billet introuvable.');
        } else {
          setTicket(found);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
      } finally {
        setLoading(false);
      }
    }

    loadTicket();
  }, []);

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toJpeg(ticketRef.current, {
        quality: 0.98,
        pixelRatio: 3,
        cacheBust: true,
        skipFonts: true,
      });
      const link = document.createElement("a");
      link.download = `ticket_${formattedCode}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error("Erreur export ticket :", err);
      alert("Impossible de générer l'image.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f8f5]">
      <Navbar />

      <main className="flex-1 py-12 px-[5%] max-w-[1200px] mx-auto w-full mt-16">

        <button
          onClick={() => navigate('/mes-billets')}
          className="mb-8 flex items-center gap-2 text-[#2e7d32] text-sm font-semibold uppercase tracking-wider hover:underline"
        >
          ← Retour à mes billets
        </button>

        <h1 className="font-garamond text-4xl sm:text-5xl font-light mb-12 text-[#080f1e] text-center">
          Mon Billet
        </h1>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-[#8a92a6]">Chargement de votre billet...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded border border-red-200">
            <p>{error}</p>
            <button
              onClick={() => navigate('/mes-billets')}
              className="mt-4 px-5 py-2 bg-[#2e7d32] text-white rounded text-sm font-semibold hover:bg-[#1b5e20] transition-colors"
            >
              Retour à la liste
            </button>
          </div>
        ) : ticket ? (
          <div className="flex flex-col items-center gap-4">

            {/* Ticket visuel */}
            <div style={{ overflowX: "auto", width: "100%" }} className="flex justify-center">
              <TicketCard
                ticketCode={ticket.ticket_code}
                ticketRef={ticketRef}
              />
            </div>

            {/* Nom du détenteur */}
            <p className="text-sm text-[#666]">
              Billet de&nbsp;<strong>{studentName}</strong>
            </p>

            {/* Bouton téléchargement */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className={`flex items-center gap-2 px-9 py-3.5 rounded-lg text-sm font-semibold text-white transition-colors ${
                isDownloading ? 'bg-gray-400 cursor-not-allowed' :
                downloaded ? 'bg-[#27ae60]' : 'bg-[#c0392b] hover:bg-[#a93226]'
              }`}
            >
              {isDownloading ? '⏳ Génération en cours…' : downloaded ? '✅ Ticket téléchargé !' : '⬇️ Télécharger mon ticket'}
            </button>

            <p className="text-xs text-[#aaa]">
              Résolution 3× · Format JPG · À présenter à l'entrée
            </p>

          </div>
        ) : null}

      </main>

      <Footer />
    </div>
  );
}