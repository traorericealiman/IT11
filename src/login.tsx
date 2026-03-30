import { useState, useEffect, useRef } from 'react';
import { registerUser } from './api/inscription';
import { loginUser } from './api/login';
import { useNavigate } from 'react-router-dom';

type Mode = 'login' | 'register';
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
  { code: '+244', country: 'AO', flag: '🇦🇴', label: 'Angola' },
  { code: '+212', country: 'MA', flag: '🇲🇦', label: 'Maroc' },
  { code: '+213', country: 'DZ', flag: '🇩🇿', label: 'Algérie' },
  { code: '+216', country: 'TN', flag: '🇹🇳', label: 'Tunisie' },
  { code: '+233', country: 'GH', flag: '🇬🇭', label: 'Ghana' },
  { code: '+234', country: 'NG', flag: '🇳🇬', label: 'Nigeria' },
  { code: '+254', country: 'KE', flag: '🇰🇪', label: 'Kenya' },
  { code: '+33',  country: 'FR', flag: '🇫🇷', label: 'France' },
  { code: '+1',   country: 'US', flag: '🇺🇸', label: 'États-Unis' },
  { code: '+32',  country: 'BE', flag: '🇧🇪', label: 'Belgique' },
  { code: '+41',  country: 'CH', flag: '🇨🇭', label: 'Suisse' },
  { code: '+1',   country: 'CA', flag: '🇨🇦', label: 'Canada' },
];

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
    p.label.toLowerCase().includes(search.toLowerCase()) ||
    p.code.includes(search) ||
    p.country.toLowerCase().includes(search.toLowerCase())
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
      className={`relative flex w-full rounded-2xl border-2 bg-white shadow-sm overflow-visible transition-all duration-200 ${
        focused ? 'border-blue-500 ring-4 ring-blue-50 shadow-blue-100' : 'border-slate-300 hover:border-slate-400'
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
        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
        <div className="absolute left-0 top-[calc(100%+6px)] w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/80 z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un pays..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:border-blue-400 bg-slate-50 placeholder:text-slate-400"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-slate-400 text-center">Aucun résultat</li>
            )}
            {filtered.map((p, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => { onPrefixChange(p.code); setOpen(false); setSearch(''); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors text-left ${
                    p.code === prefix && p.country === selected.country ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <span className="text-base">{p.flag}</span>
                  <span className="flex-1">{p.label}</span>
                  <span className="font-mono font-bold text-slate-400 text-xs">{p.code}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Alert({ type, message }: { type: 'success' | 'error'; message: string }) {
  if (type === 'success') {
    return (
      <div className="fade-in-up flex items-start gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-4 py-3.5 text-sm font-medium">
        <svg className="w-5 h-5 mt-0.5 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{message}</span>
      </div>
    );
  }
  return (
    <div className="fade-in-up flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3.5 text-sm font-medium">
      <svg className="w-5 h-5 mt-0.5 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ firstName: '', lastName: '', phoneNumber: '', password: '', confirm: '' });
  const [phonePrefix, setPhonePrefix] = useState('+225');
  const [focused, setFocused] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAlert = (type: 'success' | 'error', message: string) => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    setAlert({ type, message });
    if (type === 'success') {
      successTimerRef.current = setTimeout(() => setAlert(null), 4000);
    }
  };

  const clearAlert = () => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    setAlert(null);
  };

  const setField = (key: string, value: string) => {
    if (alert?.type === 'error') clearAlert();
    setForm(f => ({ ...f, [key]: value }));
  };

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setSwitching(true);
    setTimeout(() => {
      setMode(next);
      setForm({ firstName: '', lastName: '', phoneNumber: '', password: '', confirm: '' });
      clearAlert();
      setSwitching(false);
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlert();

    const fullPhone = `${phonePrefix} ${form.phoneNumber}`;

    if (mode === 'register') {
      setLoading(true);
      try {
        await registerUser({
          firstName: form.firstName,
          lastName:  form.lastName,
          phone:     fullPhone,
          password:  form.password,
          confirm:   form.confirm,
        });
        setForm({ firstName: '', lastName: '', phoneNumber: '', password: '', confirm: '' });
        showAlert('success', 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
      } catch (err: any) {
        showAlert('error', err.message || 'Une erreur est survenue. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    } else {
      // ── CONNEXION ────────────────────────────────────────────
      setLoading(true);
      try {
        await loginUser({ phone: fullPhone, password: form.password });
        showAlert('success', 'Connexion réussie ! Redirection en cours...');
        setTimeout(() => navigate('/randonnée'), 1200);
      } catch (err: any) {
        showAlert('error', err.message || 'Une erreur est survenue. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    }
  };

  const passwordFields = mode === 'login'
    ? [
        {
          key: 'password', label: 'Mot de passe',
          type: showPassword ? 'text' : 'password', placeholder: '••••••••',
          toggle: () => setShowPassword(v => !v), show: showPassword,
        },
      ]
    : [
        {
          key: 'password', label: 'Mot de passe',
          type: showPassword ? 'text' : 'password', placeholder: '••••••••',
          toggle: () => setShowPassword(v => !v), show: showPassword,
        },
        {
          key: 'confirm', label: 'Confirmation',
          type: showConfirm ? 'text' : 'password', placeholder: '••••••••',
          toggle: () => setShowConfirm(v => !v), show: showConfirm,
        },
      ];

  return (
    <>
      <style>{`
        @keyframes spin-reverse { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        .ring-reverse { animation: spin-reverse 4s linear infinite; transform-origin: center; transform-box: fill-box; }
        @keyframes orbit-pulse { 0%, 100% { opacity: 0.85; } 50% { opacity: 0.4; } }
        .orbit-dot { animation: orbit-pulse 2s ease-in-out infinite; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in-up { animation: fadeInUp 0.35s ease forwards; }
      `}</style>

      <div className="min-h-screen flex bg-white font-sans selection:bg-blue-100">

        {/* ── GAUCHE ── */}
        <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden bg-black">
          <img src="/images/background.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/40" />
          <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center">
            <div className="relative w-28 h-28 flex items-center justify-center mb-8">
              <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '6s', animationTimingFunction: 'linear' }} viewBox="0 0 112 112">
                <circle cx="56" cy="56" r="52" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="6 8" strokeOpacity="0.45" />
                <circle className="orbit-dot" cx="56" cy="4" r="4" fill="white" />
              </svg>
              <svg className="ring-reverse absolute inset-0 w-full h-full" viewBox="0 0 112 112">
                <circle cx="56" cy="56" r="42" fill="none" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3 10" strokeOpacity="0.65" />
                <circle className="orbit-dot" cx="56" cy="14" r="3" fill="#60a5fa" style={{ animationDelay: '1s' }} />
              </svg>
              <div className="relative z-10 flex items-center justify-center bg-white rounded-full" style={{ width: '72px', height: '72px', boxShadow: '0 0 28px rgba(255,255,255,0.18)' }}>
                <img src="/images/logo_promo.png" alt="P11" className="object-contain" style={{ width: '46px', height: '46px' }} />
              </div>
            </div>
            <h2 className="text-white text-5xl font-light leading-[1.15] mb-5" style={{ fontFamily: 'Georgia, serif' }}>
              Portail de la <br /><span className="font-bold italic text-blue-400">Promotion 11.</span>
            </h2>
            <p className="text-white/50 text-base font-light max-w-xs leading-relaxed">
              Connectez-vous pour accéder à vos ressources, événements et au réseau exclusif de la P11.
            </p>
            <div className="mt-14 flex items-center gap-3 bg-white/5 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10">
              <div className="text-white/50 text-[10px] uppercase tracking-widest font-medium">Édition Spéciale · 2024 – 2026</div>
            </div>
          </div>
        </div>

        {/* ── DROITE ── */}
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-slate-50">
          <div
            className="max-w-[420px] w-full mx-auto transition-all duration-500"
            style={{ opacity: switching ? 0 : 1, transform: switching ? 'translateX(10px)' : 'translateX(0)' }}
          >
            <div className="mb-10">
              <div className="flex lg:hidden flex-col items-center mb-8">
                <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                  <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '6s', animationTimingFunction: 'linear' }} viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r="60" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="6 8" strokeOpacity="0.35" />
                    <circle cx="64" cy="4" r="4" fill="#3b82f6" opacity="0.7" />
                  </svg>
                  <svg className="ring-reverse absolute inset-0 w-full h-full" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r="46" fill="none" stroke="#93c5fd" strokeWidth="1" strokeDasharray="3 10" strokeOpacity="0.5" />
                    <circle cx="64" cy="18" r="3" fill="#93c5fd" opacity="0.8" />
                  </svg>
                  <div className="relative z-10 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md shadow-blue-100 border border-slate-100">
                    <img src="/images/logo_promo.jpeg" alt="P11" className="w-14 h-14 object-contain" />
                  </div>
                </div>
                <span className="text-blue-600 text-[10px] font-bold tracking-[0.3em] uppercase">Promotion 11</span>
              </div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight text-center lg:text-left">
                {mode === 'login' ? 'Bienvenue' : 'Créer un compte'}
              </h1>
              <p className="text-slate-500 mt-2 font-medium text-center lg:text-left">
                {mode === 'login' ? 'Accédez à votre espace sécurisé.' : "Rejoignez la Promotion 11 dès aujourd'hui."}
              </p>
            </div>

            <div className="inline-flex bg-slate-200/70 p-1 rounded-2xl mb-8 w-full">
              {(['login', 'register'] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`flex-1 px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                    mode === m ? 'bg-white text-blue-600 shadow-md shadow-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {m === 'login' ? 'Connexion' : "S'inscrire"}
                </button>
              ))}
            </div>

            {alert && (
              <div className="mb-5">
                <Alert type={alert.type!} message={alert.message} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-3">
                  {(['firstName', 'lastName'] as const).map((key) => (
                    <div key={key}>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">
                        {key === 'firstName' ? 'Prénom' : 'Nom'}
                      </label>
                      <input
                        type="text"
                        placeholder={key === 'firstName' ? 'Jean' : 'Koffi'}
                        value={form[key]}
                        onChange={e => setField(key, e.target.value)}
                        onFocus={() => setFocused(key)}
                        onBlur={() => setFocused(null)}
                        className={`w-full px-4 py-4 rounded-2xl outline-none transition-all duration-200 text-slate-900 placeholder:text-slate-400 text-sm font-medium border-2 bg-white shadow-sm ${
                          focused === key ? 'border-blue-500 ring-4 ring-blue-50 shadow-blue-100' : 'border-slate-300 hover:border-slate-400'
                        }`}
                        required
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Téléphone</label>
                <PhoneInput
                  prefix={phonePrefix}
                  onPrefixChange={setPhonePrefix}
                  number={form.phoneNumber}
                  onNumberChange={v => setField('phoneNumber', v)}
                  focused={focused === 'phone'}
                  onFocus={() => setFocused('phone')}
                  onBlur={() => setFocused(null)}
                />
              </div>

              {passwordFields.map(field => (
                <div key={field.key} className="relative">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">{field.label}</label>
                  <div className="relative">
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={form[field.key as keyof typeof form]}
                      onChange={e => setField(field.key, e.target.value)}
                      onFocus={() => setFocused(field.key)}
                      onBlur={() => setFocused(null)}
                      className={`w-full px-5 py-4 pr-12 rounded-2xl outline-none transition-all duration-200 text-slate-900 placeholder:text-slate-400 text-sm font-medium border-2 bg-white shadow-sm ${
                        focused === field.key ? 'border-blue-500 ring-4 ring-blue-50 shadow-blue-100' : 'border-slate-300 hover:border-slate-400'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={field.toggle}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors p-1 rounded-lg hover:bg-blue-50"
                    >
                      {field.show ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-6.5 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {mode === 'login' && (
                <div className="flex justify-end -mt-1">
                  <a href="#" className="text-xs text-blue-600 hover:underline font-medium">Mot de passe oublié ?</a>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-200 transition-all duration-200 active:scale-[0.98] mt-2 flex items-center justify-center gap-3 tracking-widest text-sm"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    CHARGEMENT...
                  </>
                ) : (
                  <>
                    {mode === 'login' ? 'SE CONNECTER' : 'REJOINDRE LA PROMO'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}