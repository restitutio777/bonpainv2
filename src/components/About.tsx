import { Clock, Shield, MapPin } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function About() {
  useScrollAnimation();

  return (
    <section
      id="about"
      className="py-28 lg:py-36"
      style={{ background: '#FAF6F1' }}
    >
      <div className="container mx-auto px-5 md:px-10 max-w-[1200px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          <div className="animate-on-scroll relative">
            <div
              className="relative overflow-hidden rounded-[20px]"
              style={{ aspectRatio: '4/5', maxWidth: '500px', boxShadow: '0 16px 48px rgba(45,31,20,0.12)' }}
            >
              <img
                src="https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800&q=80"
                alt="Benjamin pétrissant le pain"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute -top-5 -right-5 w-28 h-28 rounded-[20px] -z-10"
                style={{ border: '2px solid #D4BFA5' }}
              />
            </div>
          </div>

          <div className="animate-on-scroll" style={{ transitionDelay: '0.15s' }}>
            <div
              className="text-xs font-semibold uppercase tracking-[0.15em] mb-4"
              style={{ color: '#A67C52' }}
            >
              Notre histoire
            </div>
            <h2
              className="font-display font-normal leading-[1.15] tracking-tight mb-6"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#2D1F14' }}
            >
              Le goût du{' '}
              <em className="not-italic italic" style={{ color: '#A67C52' }}>
                vrai pain
              </em>
            </h2>
            <p
              className="leading-[1.8] mb-10"
              style={{ fontSize: '1rem', color: '#6E4D32' }}
            >
              Installé au cœur des Ardennes belges, Benjamin Ramakers a fondé Bon Pain Fait Main
              avec une conviction simple : le pain mérite du temps, des ingrédients honnêtes et un
              savoir-faire authentique. Chaque miche est pétrie à la main, levée lentement au
              levain naturel, et cuite uniquement sur commande — pas de gaspillage, pas de
              compromis.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                {
                  icon: Clock,
                  title: 'Fermentation lente',
                  text: 'Minimum 24h de levée pour un pain riche en saveurs et facile à digérer.',
                },
                {
                  icon: Shield,
                  title: 'Zéro gaspillage',
                  text: 'On ne cuit que ce qui est commandé. Chaque pain trouve son destinataire.',
                },
                {
                  icon: MapPin,
                  title: 'Circuit court',
                  text: 'Farines locales, économie de proximité et distribution dans la région.',
                },
              ].map((v) => (
                <div
                  key={v.title}
                  className="p-6 rounded-xl transition-all duration-300 hover:-translate-y-1"
                  style={{ background: 'white', boxShadow: '0 1px 3px rgba(45,31,20,0.06)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      '0 4px 16px rgba(45,31,20,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      '0 1px 3px rgba(45,31,20,0.06)';
                  }}
                >
                  <div
                    className="w-11 h-11 flex items-center justify-center rounded-lg mb-4"
                    style={{ background: '#FDF8F3', color: '#A67C52' }}
                  >
                    <v.icon size={22} />
                  </div>
                  <h3
                    className="font-display font-semibold text-lg mb-2"
                    style={{ color: '#2D1F14' }}
                  >
                    {v.title}
                  </h3>
                  <p className="text-sm leading-[1.6]" style={{ color: '#8B7A6B' }}>
                    {v.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
