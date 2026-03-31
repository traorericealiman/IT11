import BookingCard from './BookingCard';
import { getUserId } from '../api/session';
import { useFadeInOnScroll } from '../hooks/useFadeInOnScroll';

const inclusions = [
  {
    number: '1',
    title: 'Transport',
    description: "Départ groupé de l'ESATIC vers la forêt du Banco, aller-retour inclus.",
  },
  {
    number: '2',
    title: 'Repas',
    description: 'repas, boissons, eau et encas fournis pour la journée.',
  },
  {
    number: '3',
    title: 'Visite Guidée',
    description: 'Parcours de la forêt du Banco avec des guides expérimentés.',
  },
  {
    number: '4',
    title: 'Jeux',
    description:
      "Profitez de nombreuses activités (tir à l'arc, jeux d'équipe, chasse au trésor) du Banco, ainsi que plusieurs autres animations pour une expérience inoubliable.",
  },
  {
    number: '5',
    title: 'Tombola',
    description: 'Tentez votre chance à la tombola pour gagner des prix pour seulement 500 fcfa.',
  },
];

export default function InclusSection() {
  const heading = useFadeInOnScroll();
  const card = useFadeInOnScroll();
  const studentId = getUserId();
  return (
    <section className="py-16 sm:py-32 px-[5%] max-w-[1400px] mx-auto" id="inclus">

      {/* Titre */}
      <div
        ref={heading.ref}
        className="flex items-end justify-between gap-10 transition-all duration-700 ease-out"
        style={{
          opacity: heading.visible ? 1 : 0,
          transform: heading.visible ? 'translateY(0)' : 'translateY(24px)',
        }}
      >
        <div className="flex-1">
          <h2 className="font-garamond text-[clamp(2.5rem,5.5vw,4.8rem)] leading-[1.05] font-light">
            Tout est prêt.
            <br />
            Il ne manque que vous.
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-12 sm:gap-[90px] mt-12 sm:mt-[70px]">

        {/* Liste des inclusions */}
        <div>
          {inclusions.map((item, index) => (
            <InclusionRow key={index} item={item} index={index} />
          ))}
        </div>

        {/* Booking card */}
        <div
          ref={card.ref}
          className="transition-all duration-700 ease-out"
          style={{
            opacity: card.visible ? 1 : 0,
            transform: card.visible ? 'translateY(0)' : 'translateY(32px)',
            transitionDelay: '200ms',
          }}
        >
          {studentId ? (
            <BookingCard studentId={studentId} />
          ) : (
            <div className="bg-[#f5f8f5] rounded border-l-[3px] border-[#2e7d32] p-8 text-center">
              <p className="font-garamond text-xl text-[#080f1e]">
                Connectez-vous pour acheter votre ticket.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function InclusionRow({ item, index }: { item: (typeof inclusions)[0]; index: number }) {
  const { ref, visible } = useFadeInOnScroll();

  return (
    <div
      ref={ref}
      className="flex py-9 border-b border-[#eee] gap-0 items-start transition-all duration-600 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-20px)',
        transitionDelay: `${index * 80}ms`,
        transitionDuration: '600ms',
      }}
    >
      <span className="font-garamond text-2xl text-[#2e7d32] min-w-[60px] pt-0.5">
        {item.number}
      </span>
      <div>
        <strong className="block text-xl mb-1.5 font-semibold">{item.title}</strong>
        <span className="text-[#8a92a6] text-base">{item.description}</span>
      </div>
    </div>
  );
}