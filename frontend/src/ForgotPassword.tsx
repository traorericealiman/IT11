import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: intégrer l'endpoint de réinitialisation du mot de passe
    await new Promise(r => setTimeout(r, 800));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 mb-8 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Retour à la connexion
        </button>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Mot de passe oublié</h1>
        <p className="text-slate-500 text-sm mb-8">
          Entrez votre numéro de téléphone et nous vous enverrons les instructions.
        </p>

        {submitted ? (
          <div className="flex flex-col items-center text-center gap-4 py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-slate-700 font-medium">
              Si ce numéro est enregistré, vous recevrez les instructions sous peu.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Retour à la connexion
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+225 07 XX XX XX XX"
                required
                className="w-full px-4 py-4 rounded-2xl border-2 border-slate-300 outline-none text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-200 transition-all duration-200 flex items-center justify-center gap-3 tracking-widest text-sm"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  ENVOI EN COURS...
                </>
              ) : 'ENVOYER LES INSTRUCTIONS'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
