import { Clock, MapPin, Home } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const hours = [
  { day: 'Mercredi', time: '8h00 à 12h00' },
  { day: 'Vendredi', time: '8h00 à 12h00 & 13h00 à 15h00' },
  { day: 'Samedi', time: '8h00 à 12h00' },
];

const stores = [
  { name: "Épicerie du Village", location: 'Waimes' },
  { name: 'Bio-Laden Eifel', location: 'Bütgenbach' },
  { name: 'Ferme-Fromagerie', location: 'Malmedy' },
];

export default function Info() {
  useScrollAnimation();

  return (
    <section id="info" className="py-28 lg:py-36" style={{ background: '#FAF6F1' }}>
      <div className="container mx-auto px-5 md:px-10 max-w-[1200px]">
        <div className="text-center max-w-[600px] mx-auto mb-16 animate-on-scroll">
          <div
            className="text-xs font-semibold uppercase tracking-[0.15em] mb-4"
            style={{ color: '#A67C52' }}
          >
            Informations
          </div>
          <h2
            className="font-display font-normal leading-[1.15]"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#2D1F14' }}
          >
            Quand, où,{' '}
            <em className="not-italic italic" style={{ color: '#A67C52' }}>
              comment
            </em>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            className="animate-on-scroll p-10 rounded-[20px] text-center transition-shadow duration-300"
            style={{ background: 'white', boxShadow: '0 1px 3px rgba(45,31,20,0.06)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(45,31,20,0.08)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(45,31,20,0.06)';
            }}
          >
            <div
              className="w-14 h-14 flex items-center justify-center rounded-full mx-auto mb-5"
              style={{
                background: 'linear-gradient(135deg, #FDF8F3, #F5EDE3)',
                color: '#A67C52',
              }}
            >
              <Clock size={24} />
            </div>
            <h3
              className="font-display text-xl font-semibold mb-4"
              style={{ color: '#2D1F14' }}
            >
              Horaires
            </h3>
            <ul className="list-none p-0">
              {hours.map((h) => (
                <li
                  key={h.day}
                  className="py-2 text-sm leading-[1.7]"
                  style={{ borderBottom: '1px solid #F5EDE3', color: '#6E4D32' }}
                >
                  <span className="font-semibold" style={{ color: '#2D1F14' }}>
                    {h.day}
                  </span>{' '}
                  — {h.time}
                </li>
              ))}
            </ul>
          </div>

          <div
            className="animate-on-scroll p-10 rounded-[20px] text-center transition-shadow duration-300"
            style={{
              background: 'white',
              boxShadow: '0 1px 3px rgba(45,31,20,0.06)',
              transitionDelay: '0.1s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(45,31,20,0.08)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(45,31,20,0.06)';
            }}
          >
            <div
              className="w-14 h-14 flex items-center justify-center rounded-full mx-auto mb-5"
              style={{
                background: 'linear-gradient(135deg, #FDF8F3, #F5EDE3)',
                color: '#A67C52',
              }}
            >
              <MapPin size={24} />
            </div>
            <h3
              className="font-display text-xl font-semibold mb-4"
              style={{ color: '#2D1F14' }}
            >
              Adresse
            </h3>
            <p className="text-sm leading-[1.7]" style={{ color: '#6E4D32' }}>
              Bon Pain Fait Main
              <br />
              Rue de la Roer 19
              <br />
              4950 Waimes, Belgique
            </p>
            <p
              className="mt-3 text-xs leading-[1.7]"
              style={{ color: '#8B7A6B' }}
            >
              Retrait sur place uniquement.
              <br />
              Commande minimum 2 jours à l'avance.
            </p>
          </div>

          <div
            className="animate-on-scroll p-10 rounded-[20px] text-center transition-shadow duration-300"
            style={{
              background: 'white',
              boxShadow: '0 1px 3px rgba(45,31,20,0.06)',
              transitionDelay: '0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(45,31,20,0.08)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(45,31,20,0.06)';
            }}
          >
            <div
              className="w-14 h-14 flex items-center justify-center rounded-full mx-auto mb-5"
              style={{
                background: 'linear-gradient(135deg, #FDF8F3, #F5EDE3)',
                color: '#A67C52',
              }}
            >
              <Home size={24} />
            </div>
            <h3
              className="font-display text-xl font-semibold mb-4"
              style={{ color: '#2D1F14' }}
            >
              Points de vente
            </h3>
            <ul className="list-none p-0">
              {stores.map((s) => (
                <li
                  key={s.name}
                  className="py-2 text-sm leading-[1.7] flex flex-col items-center gap-1"
                  style={{ borderBottom: '1px solid #F5EDE3' }}
                >
                  <span style={{ color: '#2D1F14' }}>{s.name}</span>
                  <span
                    className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs"
                    style={{ background: '#FDF8F3', color: '#A67C52' }}
                  >
                    <MapPin size={10} />
                    {s.location}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
