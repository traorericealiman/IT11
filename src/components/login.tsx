import { useState, useEffect, useRef } from 'react';
import { loginUser } from '../api/login';
import { useNavigate } from 'react-router-dom';

type AlertType = 'success' | 'error' | null;

const PHONE_PREFIXES = [
  { code: '+225', country: 'CI', flag: '🇨🇮', label: "Côte d'Ivoire" },
  { code: '+221', country: 'SN', flag: '🇸🇳', label: 'Sénégal' },
  { code: '+223', country: 'ML', flag: '🇲🇱', label: 'Mali' },
  { code: '+226', country: 'BF', flag: '🇧🇫', label: 'Burkina Faso' },
  { code: '+227', country: 'NE', flag: '🇳🇪', label: 'Niger' },
  { code: '+228', country: 'TG', flag: '🇹🇬', label: 'Togo' },
  { code: '+229', country: 'BJ', flag: '🇧🇯', label: 'Bénin' },
  { code: '+237', country: 'CM', flag: '🇨🇲', label: 'Cameroun' },
  { code: '+241', country: 'GA', flag: '🇬🇦', label: 'Gabon' },
  { code: '+242', country: 'CG', flag: '🇨🇬', label: 'Congo' },
  { code: '+243', country: 'CD', flag: '🇨🇩', label: 'RD Congo' },
  { code: '+33',  country: 'FR', flag: '🇫🇷', label: 'France' },
  { code: '+1',   country: 'US', flag: '🇺🇸', label: 'États-Unis' },
  { code: '+212', country: 'MA', flag: '🇲🇦', label: 'Maroc' },
];

// --- COMPOSANT INPUT TÉLÉPHONE AVEC SÉLECTEUR DE PAYS ---
function PhoneInput({
  prefix, onPrefixChange,
  number, onNumberChange,
  focused, onFocus, onBlur
}: {
  prefix: string; onPrefixChange: (p: string) => void;
  number: string; onNumberChange: (n: string) => void;
  focused: boolean; onFocus: () => void; onBlur: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = PHONE_PREFIXES.find(p => p.code === prefix) ?? PHONE_PREFIXES[0];
  const filtered = PHONE_PREFIXES.filter(p =>
    p.label.toLowerCase().includes(search.toLowerCase()) || p.code.includes(search)
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  return (
    <div
      ref={dropdownRef}
      className={`relative flex w-full rounded-2xl border-2 bg-white shadow-sm transition-all duration-200 ${
        focused ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-300 hover:border-slate-400'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-4 border-r-2 border-slate-200 hover:bg-slate-50 transition-colors rounded-l-2xl shrink-0"
        onFocus={onFocus} onBlur={onBlur}
      >
        <span className="text-lg leading-none">{selected.flag}</span>
        <span className="text-sm font-bold text-slate-700 tabular-nums">{selected.code}</span>
        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <input
        type="tel"
        placeholder="00 00 00 00 00"
        value={number}
        onChange={e => onNumberChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        className="flex-1 px-4 py-4 outline-none text-slate-900 placeholder:text-slate-400 text-sm font-medium bg-transparent rounded-r-2xl"
        required
      />

      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un pays..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:border-blue-400 bg-slate-50"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.map((p, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => { onPrefixChange(p.code); setOpen(false); setSearch(''); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-blue-50 text-left ${p.code === prefix ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'}`}
                >
                  <span className="text-base">{p.flag}</span>
                  <span className="flex-1">{p.label}</span>
                  <span className="font-mono text-slate-400 text-xs">{p.code}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// --- COMPOSANT ALERTE ---
function Alert({ type, message }: { type: 'success' | 'error'; message: string }) {
  const isSuccess = type === 'success';
  return (
    <div className={`fade-in-up flex items-start gap-3 border rounded-2xl px-4 py-3.5 text-sm font-medium ${isSuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
      <svg className={`w-5 h-5 mt-0.5 shrink-0 ${isSuccess ? 'text-emerald-500' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isSuccess ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"} />
      </svg>
      <span>{message}</span>
    </div>
  );
}

// --- PAGE DE CONNEXION PRINCIPALE ---
export default function AuthPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ phoneNumber: '', password: '' });
  const [phonePrefix, setPhonePrefix] = useState('+225');
  const [focused, setFocused] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);

    const fullPhone = `${phonePrefix} ${form.phoneNumber}`;

    try {
      await loginUser({ phone: fullPhone, password: form.password });
      setAlert({ type: 'success', message: 'Connexion réussie !' });
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Identifiants incorrects.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin-reverse { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        .ring-reverse { animation: spin-reverse 4s linear infinite; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in-up { animation: fadeInUp 0.35s ease forwards; }
      `}</style>

      <div className="min-h-screen flex bg-white font-sans selection:bg-blue-100">
        
        {/* SECTION GAUCHE (VISUELLE) */}
        <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden bg-black">
          <img src="/images/background.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/40" />
          
          <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center">
            <div className="relative w-28 h-28 flex items-center justify-center mb-8">
              <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '6s' }} viewBox="0 0 112 112">
                <circle cx="56" cy="56" r="52" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="6 8" strokeOpacity="0.45" />
              </svg>
              <div className="relative z-10 flex items-center justify-center bg-white rounded-full w-[72px] h-[72px] shadow-2xl">
                <img src="/images/logo_promo.png" alt="P11" className="w-11 h-11 object-contain" />
              </div>
            </div>
            
            <h2 className="text-white text-5xl font-light leading-[1.15] mb-5" style={{ fontFamily: 'Georgia, serif' }}>
              Portail de la <br /><span className="font-bold italic text-blue-400">Promotion 11.</span>
            </h2>
            <p className="text-white/50 text-base font-light max-w-xs leading-relaxed">
              Connectez-vous pour accéder à vos ressources et au réseau exclusif.
            </p>
          </div>
        </div>

        {/* SECTION DROITE (FORMULAIRE) */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-slate-50">
          <div className="max-w-[420px] w-full mx-auto">
            
            <div className="mb-10 text-center lg:text-left">
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Bienvenue</h1>
              <p className="text-slate-500 mt-2 font-medium">Saisissez vos identifiants pour continuer.</p>
            </div>

            {alert && (
              <div className="mb-6">
                <Alert type={alert.type!} message={alert.message} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Champ Téléphone */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Téléphone</label>
                <PhoneInput
                  prefix={phonePrefix}
                  onPrefixChange={setPhonePrefix}
                  number={form.phoneNumber}
                  onNumberChange={v => setForm(f => ({ ...f, phoneNumber: v }))}
                  focused={focused === 'phone'}
                  onFocus={() => setFocused('phone')}
                  onBlur={() => setFocused(null)}
                />
              </div>

              {/* Champ Mot de passe */}
              <div className="relative">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    className={`w-full px-5 py-4 pr-12 rounded-2xl outline-none transition-all duration-200 border-2 bg-white shadow-sm ${
                      focused === 'password' ? 'border-blue-500 ring-4 ring-blue-50 shadow-blue-100' : 'border-slate-300 hover:border-slate-400'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex justify-end -mt-2">
                <a href="#" className="text-xs text-blue-600 hover:underline font-semibold">Mot de passe oublié ?</a>
              </div>

              {/* Bouton de Soumission */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-3 tracking-widest text-sm"
              >
                {loading ? (
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : 'SE CONNECTER'}
              </button>

            </form>
          </div>
        </div>
      </div>
    </>
  );
}