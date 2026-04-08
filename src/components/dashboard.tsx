import { useEffect, useState } from 'react';
import { getPaymentRequests, PaymentRequest } from '../api/liste_paiement';
import { validatePayment } from '../api/valide_paiement';
import { rejectPaymentRequest } from '../api/liste_paiement';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminDashboard() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);

  const firstName = localStorage.getItem('firstName') ?? 'Admin';

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const data = await getPaymentRequests(filter === 'all' ? undefined : filter);
      setRequests(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [filter]);

  const counts = {
    all:      requests.length,
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const handleApprove = async (paymentId: string, studentId: string) => {
    setActionId(paymentId);
    try {
      await validatePayment({ student_id: studentId, payment_id: paymentId });
      await fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la validation');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    setRejectId(paymentId);
    try {
      await rejectPaymentRequest(paymentId);
      await fetchData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors du refus');
    } finally {
      setRejectId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h2 className="text-sm font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Espace Administration</h2>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Suivi des Paiements</h1>
          <p className="text-slate-500 font-medium mt-1">
            Ravi de vous revoir, <span className="text-slate-900 font-bold">{firstName}</span> 👋
          </p>
        </div>
        <button
          onClick={fetchData}
          className="group flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 hover:border-blue-500 hover:text-blue-600 rounded-2xl font-bold text-sm transition-all shadow-sm"
        >
          <svg className="w-5 h-5 group-active:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualiser les données
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Total Transactions',       value: counts.all,      color: 'blue',    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'En attente de validation', value: counts.pending,  color: 'amber',   icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Paiements Approuvés',      value: counts.approved, color: 'emerald', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Demandes Refusées',        value: counts.rejected, color: 'red',     icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' },
        ].map(s => (
          <div key={s.label} className={`relative p-8 rounded-[2.5rem] border-b-4 border-${s.color}-500 bg-white shadow-xl shadow-slate-200/40 overflow-hidden`}>
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${s.color}-50 rounded-full opacity-50`} />
            <div className={`p-3 bg-${s.color}-50 text-${s.color}-600 rounded-2xl w-fit mb-4 relative`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={s.icon} />
              </svg>
            </div>
            <div className="text-4xl font-black text-slate-900 mb-1 tracking-tighter">{s.value}</div>
            <div className="text-xs uppercase tracking-[0.15em] font-black text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtre */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div className="bg-slate-100 p-1.5 rounded-2xl flex w-full sm:w-fit">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 sm:flex-none px-6 py-2.5 text-xs font-black rounded-xl transition-all ${
                filter === f ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f === 'all' ? 'TOUT' : f === 'pending' ? 'EN ATTENTE' : f === 'approved' ? 'APPROUVÉ' : 'REFUSÉ'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border-2 border-slate-50 overflow-hidden shadow-2xl shadow-slate-200/60">
        {error && (
          <div className="m-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3 text-red-600 font-bold">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Désolé : {error}
          </div>
        )}

        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-slate-400 font-black text-sm tracking-widest animate-pulse">CHARGEMENT DU DASHBOARD...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-32 text-center">
            <div className="text-6xl mb-4">📂</div>
            <p className="text-slate-400 font-bold text-lg tracking-tight">Aucune demande trouvée pour ce filtre.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Étudiant</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Téléphone</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tickets</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 flex items-center justify-center font-black text-sm border border-blue-100 group-hover:scale-110 transition-transform">
                          {r.first_name?.[0]}{r.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 leading-none mb-1">{r.first_name} {r.last_name}</p>
                          <p className="text-xs text-slate-400 font-bold tracking-tighter">Membre Promotion 11</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-sm text-slate-500 font-bold tabular-nums italic">{r.phone}</td>
                    <td className="p-6 text-center">
                      <span className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-black">{r.quantity}</span>
                    </td>
                    <td className="p-6">
                      <div className="text-sm font-black text-slate-900">
                        {r.amount_paid.toLocaleString()} <span className="text-blue-600 text-[10px]">FCFA</span>
                      </div>
                    </td>
                    <td className="p-6">
                      {r.status === 'pending' ? (
                        <div className="flex flex-col gap-2">
                          {/* Bouton Valider */}
                          <button
                            disabled={actionId === r.id || rejectId === r.id}
                            onClick={() => handleApprove(r.id, r.student_id)}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-200"
                          >
                            {actionId === r.id ? 'TRAITEMENT...' : 'VALIDER LE PAIEMENT'}
                          </button>
                          {/* Bouton Refuser */}
                          <button
                            disabled={actionId === r.id || rejectId === r.id}
                            onClick={() => handleReject(r.id)}
                            className="w-full bg-white hover:bg-red-50 disabled:bg-slate-100 disabled:text-slate-400 text-red-500 border-2 border-red-100 hover:border-red-300 px-6 py-2.5 rounded-2xl text-[10px] font-black tracking-widest transition-all active:scale-95"
                          >
                            {rejectId === r.id ? 'TRAITEMENT...' : 'REFUSER'}
                          </button>
                        </div>
                      ) : r.status === 'approved' ? (
                        <div className="flex items-center justify-center gap-2 text-emerald-500 bg-emerald-50 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-emerald-100">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                          Confirmé
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-red-400 bg-red-50 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-red-100">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Refusé
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}