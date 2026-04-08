import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../api/session';
import { downloadTicket, fetchTicketStatus, Ticket } from '../api/ticket_student';

type StatusKind = 'loading' | 'none' | 'pending' | 'rejected' | 'approved' | 'unauthenticated';

function useFadeInOnScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function TicketNavbar() {
  const navigate = useNavigate();
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 5%', background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
    }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          color: '#1a5c1e', fontFamily: "'DM Mono', monospace",
          fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase',
          fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer',
          opacity: 1, transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.55')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Retour
      </button>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {['#1a5c1e', '#4CAF50', '#A5D6A7'].map((c, i) => (
          <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
        ))}
      </div>
    </nav>
  );
}

function TicketRow({ ticket, index, downloaded, onDownload }: {
  ticket: Ticket;
  index: number;
  downloaded: boolean;
  onDownload: (id: string) => void;
}) {
  const { ref, visible } = useFadeInOnScroll();
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const formattedDate = new Date(ticket.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const handleClick = async () => {
    setLoading(true);
    try {
      await downloadTicket(ticket.id);
      onDownload(ticket.id);
    } catch {
      alert('Erreur lors du téléchargement. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={ref}
      style={{
        display: 'grid', gridTemplateColumns: '52px 1fr auto',
        alignItems: 'center', gap: '24px', padding: '28px 0',
        borderBottom: '1px solid #e8ede8',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 500ms ease ${index * 70}ms, transform 500ms ease ${index * 70}ms`,
      }}
    >
      <span style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: '28px', color: '#4CAF50', fontStyle: 'italic', lineHeight: 1,
      }}>
        {String(index + 1).padStart(2, '0')}
      </span>

      <div>
        <span style={{
          display: 'block', fontFamily: "'DM Mono', monospace",
          fontSize: '15px', fontWeight: 500, color: '#0d1f0e',
          letterSpacing: '0.06em', marginBottom: '4px',
        }}>
          {ticket.ticket_code}
        </span>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '12px', color: '#8fa08f', letterSpacing: '0.03em',
        }}>
          Obtenu le {formattedDate}
        </span>
      </div>

      <button
        onClick={handleClick}
        disabled={loading}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          padding: '10px 22px', fontFamily: "'DM Mono', monospace",
          fontSize: '10px', letterSpacing: '0.18em',
          textTransform: 'uppercase', fontWeight: 600,
          border: '1.5px solid #1a5c1e',
          borderRadius: '2px',
          background: hovered && !loading ? '#1a5c1e' : 'transparent',
          color: hovered && !loading ? '#fff' : '#1a5c1e',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.5 : 1,
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}
      >
        {loading ? 'En cours' : downloaded ? 'Télécharger' : 'Télécharger'}
      </button>
    </div>
  );
}

function StatusCard({ icon, color, title, children }: {
  icon: string; color: string; title: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      marginTop: '48px', padding: '40px 44px',
      border: `1px solid ${color}22`, borderLeft: `3px solid ${color}`,
      background: `${color}06`, borderRadius: '2px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(1.3rem, 3vw, 1.9rem)',
          fontWeight: 400, color: '#0d1f0e', fontStyle: 'italic',
        }}>
          {title}
        </p>
      </div>
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14px', color: '#5a6e5a', lineHeight: 1.7,
      }}>
        {children}
      </div>
    </div>
  );
}

function StatusLoading() {
  return (
    <div style={{ marginTop: '48px', display: 'flex', alignItems: 'center', gap: '14px', padding: '40px 0' }}>
      <span style={{
        display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
        background: '#4CAF50', animation: 'pulse 1.4s ease-in-out infinite',
      }} />
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px', color: '#8fa08f' }}>
        Chargement de vos billets…
      </p>
    </div>
  );
}

function PendingBanner({ ready, total }: { ready: number; total: number }) {
  const remaining = total - ready;
  const pct = total > 0 ? Math.round((ready / total) * 100) : 0;
  return (
    <div style={{
      padding: '16px 20px', background: '#fffbeb',
      border: '1px solid #fde68a', borderLeft: '3px solid #f59e0b',
      borderRadius: '2px', marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span style={{
          display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
          background: '#f59e0b', animation: 'pulse 1.4s ease-in-out infinite',
        }} />
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#92400e', fontWeight: 500 }}>
          <strong>{ready}</strong> billet{ready > 1 ? 's' : ''} prêt{ready > 1 ? 's' : ''} /{' '}
          <strong>{total}</strong> commandé{total > 1 ? 's' : ''} —{' '}
          <span style={{ color: '#b45309' }}>{remaining} en cours de génération…</span>
        </p>
      </div>
      <div style={{ height: '3px', background: '#fde68a', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: '#f59e0b', borderRadius: '99px',
          width: `${pct}%`, transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  );
}

function AnalyseBanner({ count }: { count: number }) {
  return (
    <div style={{
      padding: '16px 20px', background: '#fffbeb',
      border: '1px solid #fde68a', borderLeft: '3px solid #f59e0b',
      borderRadius: '2px', marginBottom: '16px',
      fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#92400e',
    }}>
      <strong>{count}</strong> demande{count > 1 ? 's' : ''} en cours d'analyse.
    </div>
  );
}

function RefusBanner({ count }: { count: number }) {
  return (
    <div style={{
      padding: '16px 20px', background: '#fef2f2',
      border: '1px solid #fecaca', borderLeft: '3px solid #ef4444',
      borderRadius: '2px', marginBottom: '16px',
      fontFamily: "'DM Sans', sans-serif", fontSize: '13px', color: '#991b1b',
    }}>
      <strong>{count}</strong> demande{count > 1 ? 's' : ''} refusée{count > 1 ? 's' : ''}.{' '}
      Si vous pensez qu'il s'agit d'une erreur, contactez-nous au{' '}
      <a href="tel:0707406906" style={{ color: '#991b1b', fontWeight: 700 }}>
        07 07 40 69 06
      </a>.
    </div>
  );
}

export default function RecupererMonTicket() {
  const heading = useFadeInOnScroll();
  const [status, setStatus] = useState<StatusKind>('loading');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsReady, setTicketsReady] = useState(0);
  const [ticketsTotal, setTicketsTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [downloaded, setDownloaded] = useState<string[]>([]);
  const token = getToken();

  useEffect(() => {
    if (!token) { setStatus('unauthenticated'); return; }

    fetchTicketStatus()
      .then((res) => {
        const d = res.data;
        setStatus(d.status);
        if (d.status === 'approved') {
          setTickets(d.tickets);
          setTicketsReady((d as any).tickets_ready ?? d.tickets.length);
          setTicketsTotal((d as any).tickets_total ?? d.tickets.length);
          setPendingCount((d as any).pending_count ?? 0);
          setRejectedCount((d as any).rejected_count ?? 0);
        }
      })
      .catch(() => setStatus('none'));
  }, [token]);

  const handleDownload = (id: string) =>
    setDownloaded((prev) => prev.includes(id) ? prev : [...prev, id]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        body { background: #f7faf7; }
        #ticket-page::before {
          content: ''; position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          opacity: 0.4;
        }
      `}</style>

      <TicketNavbar />

      <section id="ticket-page" style={{
        position: 'relative', minHeight: '100vh',
        paddingTop: 'calc(64px + 5rem)', paddingBottom: '6rem',
        paddingLeft: '5%', paddingRight: '5%',
        maxWidth: '860px', margin: '0 auto',
      }}>
        <div
          ref={heading.ref}
          style={{
            opacity: heading.visible ? 1 : 0,
            transform: heading.visible ? 'translateY(0)' : 'translateY(28px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
            marginBottom: '16px',
          }}
        >
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(3rem, 7vw, 5.5rem)',
            fontWeight: 400, lineHeight: 1.0, color: '#0d1f0e', letterSpacing: '-0.01em',
          }}>
            Vos<br />
            <em style={{ color: '#2e7d32', fontStyle: 'italic' }}>billets.</em>
          </h1>
          <div style={{
            marginTop: '28px', height: '1px',
            background: 'linear-gradient(to right, #4CAF50, transparent)',
            width: heading.visible ? '100%' : '0%',
            transition: 'width 1s ease 0.3s',
          }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>

          {status === 'unauthenticated' && (
            <StatusCard icon="🔒" color="#6366f1" title="Connexion requise.">
              Veuillez vous connecter pour accéder à vos billets.
            </StatusCard>
          )}

          {status === 'loading' && <StatusLoading />}

          {status === 'none' && (
            <StatusCard icon="🎟" color="#94a3b8" title="Aucun billet pour l'instant.">
              Vos billets apparaîtront ici après votre achat.
            </StatusCard>
          )}

          {status === 'pending' && (
            <StatusCard icon="⏳" color="#f59e0b" title="Demande en cours de vérification">
              Votre paiement est en cours d'examen. Votre billet apparaîtra ici dès validation.
            </StatusCard>
          )}

          {status === 'rejected' && (
            <StatusCard icon="✕" color="#ef4444" title="Demande refusée.">
              <p>Votre demande de paiement a été refusée.</p>
              <p style={{ marginTop: '8px' }}>
                Si vous pensez qu'il s'agit d'une erreur, contactez-nous au{' '}
                <a href="tel:0707406906" style={{ color: '#1a5c1e', fontWeight: 600 }}>
                  0707 40 69 06
                </a>.
              </p>
            </StatusCard>
          )}

          {status === 'approved' && (
            <div style={{ marginTop: '48px' }}>

              {/* Billets en cours de génération */}
              {ticketsReady < ticketsTotal && (
                <PendingBanner ready={ticketsReady} total={ticketsTotal} />
              )}

              {/* Demandes en attente d'analyse */}
              {pendingCount > 0 && <AnalyseBanner count={pendingCount} />}

              {/* Demandes refusées */}
              {rejectedCount > 0 && <RefusBanner count={rejectedCount} />}

              {/* Aucun ticket encore généré */}
              {tickets.length === 0 ? (
                <div style={{ padding: '48px 0', borderTop: '1px solid #e0e8e0' }}>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '14px', color: '#8fa08f', lineHeight: 1.7,
                  }}>
                    Paiement validé. Vos billets sont en cours de génération —
                    revenez dans quelques instants.
                  </p>
                </div>
              ) : (
                <div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    borderTop: '1px solid #e0e8e0', paddingTop: '20px', marginBottom: '8px',
                  }}>
                    <p style={{
                      fontFamily: "'DM Mono', monospace", fontSize: '11px',
                      color: '#8fa08f', letterSpacing: '0.12em', textTransform: 'uppercase',
                    }}>
                      {tickets.length} billet{tickets.length > 1 ? 's' : ''}
                    </p>
                  </div>

                  {tickets.map((ticket, index) => (
                    <TicketRow
                      key={ticket.id}
                      ticket={ticket}
                      index={index}
                      downloaded={downloaded.includes(ticket.id)}
                      onDownload={handleDownload}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <p style={{
          marginTop: '80px', fontFamily: "'DM Mono', monospace",
          fontSize: '10px', color: '#b8c8b8', letterSpacing: '0.2em',
          textTransform: 'uppercase', textAlign: 'center',
        }}>
          Support · 0707 40 69 06
        </p>
      </section>
    </>
  );
}