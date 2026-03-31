import { useState } from 'react';
import { initiatePayment } from '../api/paiment';

const PRICE = 5050;
const MAX = 3;

interface BookingCardProps {
  studentId: string; 
}

export default function BookingCard({ studentId }: BookingCardProps) {
  const [qty, setQty] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateQuantity = (newQty: number) => {
    if (newQty < 1 || newQty > MAX) return;
    setIsUpdating(true);
    setQty(newQty);
    setTimeout(() => setIsUpdating(false), 150);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone.trim()) {
      setError('Veuillez entrer votre numéro de téléphone Wave.');
      return;
    }

    setLoading(true);
    try {
      await initiatePayment({
        student_id:   studentId,
        quantity:     qty,
        sender_phone: phone.trim(),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const total = qty * PRICE;

  return (
    <div
      className="bg-[#f5f8f5] rounded border-l-[3px] border-[#2e7d32] lg:sticky lg:top-[100px] overflow-hidden"
      id="paiement"
    >
      {/* Ticket image */}
      <div className="w-full flex items-center justify-center p-4 pb-2">
        <div
          className="w-full bg-white p-3 pb-8"
          style={{
            boxShadow: '0 4px 20px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.08)',
            transform: 'rotate(-1.2deg)',
          }}
        >
          <img
            src="/images/ticket.jpeg"
            alt="Ticket Randonnée des 11"
            className="w-full object-contain block"
          />
        </div>
      </div>

      {/* Form */}
      <div className="p-6 sm:p-8">
        <h3 className="font-garamond text-2xl sm:text-[2.2rem] font-light">
          Achetez votre ticket
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Quantity selector */}
          <div className="flex items-center justify-between bg-white py-4 px-5 border border-[#dde8dd] my-5 rounded-sm">
            <div>
              <span className="font-garamond text-base font-semibold">Nombre de billets</span>
              <p className="text-xs text-[#8a92a6] mt-0.5">Maximum 3 par achat</p>
            </div>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => updateQuantity(qty - 1)}
                disabled={qty <= 1}
                className="w-[42px] h-[42px] border border-[#c8d8c8] bg-white rounded-full cursor-pointer text-xl transition-all duration-200 text-[#2e7d32] hover:border-[#2e7d32] hover:bg-[#2e7d32] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#2e7d32] disabled:hover:border-[#c8d8c8]"
              >
                −
              </button>
              <span
                className="font-garamond text-[2.2rem] text-[#080f1e]"
                style={{
                  fontVariantNumeric: 'tabular-nums',
                  fontFeatureSettings: '"tnum", "lnum"',
                }}
              >
                {qty}
              </span>
              <button
                type="button"
                onClick={() => updateQuantity(qty + 1)}
                disabled={qty >= MAX}
                className="w-[42px] h-[42px] border border-[#c8d8c8] bg-white rounded-full cursor-pointer text-xl transition-all duration-200 text-[#2e7d32] hover:border-[#2e7d32] hover:bg-[#2e7d32] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#2e7d32] disabled:hover:border-[#c8d8c8]"
              >
                +
              </button>
            </div>
          </div>

          {/* Phone field */}
          <div className="mb-5">
            <label className="block text-xs font-semibold uppercase text-[#8a92a6] tracking-[0.1em] mb-2">
              Numéro Wave
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: 07 XX XX XX XX"
              required
              className="w-full bg-white border border-[#dde8dd] rounded-sm px-4 py-3 text-[#080f1e] text-sm outline-none focus:border-[#2e7d32] transition-colors duration-200 placeholder:text-[#c8d8c8]"
            />
          </div>

          {/* Total price */}
          <div className="flex justify-between items-end mb-5">
            <span className="text-xs font-semibold uppercase text-[#8a92a6] pb-2.5 tracking-[0.1em]">
              Prix Total (fcfa)
            </span>
            <span
              className={`font-garamond text-[3.2rem] text-[#2e7d32] leading-none transition-all duration-150 ${
                isUpdating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
              }`}
              style={{
                fontVariantNumeric: 'tabular-nums',
                fontFeatureSettings: '"tnum", "lnum"',
              }}
            >
              {total.toLocaleString('fr-FR')}
            </span>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-sm text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-[#2e7d32] text-white border-none rounded-sm uppercase tracking-[0.25em] font-semibold text-[0.85rem] cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(46,125,50,0.25)] hover:bg-[#1b5e20] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:hover:bg-[#2e7d32]"
          >
            {loading ? 'Traitement en cours…' : 'Payer via Wave'}
          </button>
        </form>
      </div>
    </div>
  );
}