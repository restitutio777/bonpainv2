import { Clock, CakeSlice, Wheat, ChevronRight } from 'lucide-react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

const breads = [
  'Pain Gris levain',
  'Pain Fagnard',
  'Pain aux noix',
  'Pain Epeautre',
  'Pain epeautre sesame',
  'Pain Rustik',
  'Pain aux seigle',
  'Pain bucheron',
  'Cramique',
  'Baguettes tradition',
  'Tarte du jour',
]

const viennoiseries = ['Croissant', 'Pain au chocolat']

const days = [
  {
    day: 'Mercredi',
    hours: ['8h — 12h'],
    hasViennoiseries: false,
  },
  {
    day: 'Vendredi',
    hours: ['8h — 12h', '13h — 15h'],
    hasViennoiseries: false,
  },
  {
    day: 'Samedi',
    hours: ['8h — 12h'],
    hasViennoiseries: true,
  },
]

export default function Schedule() {
  useScrollAnimation()

  return (
    <section
      id="schedule"
      className="py-28 lg:py-36 relative"
      style={{ background: '#FDF8F3' }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #E8D9C8, transparent)' }}
      />
      <div className="container mx-auto px-5 md:px-10 max-w-[1000px]">
        <div className="text-center max-w-[600px] mx-auto mb-16 animate-on-scroll">
          <div
            className="text-xs font-semibold uppercase tracking-[0.15em] mb-4"
            style={{ color: '#A67C52' }}
          >
            Jours de vente
          </div>
          <h2
            className="font-display font-normal leading-[1.15] mb-4"
            style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', color: '#2D1F14' }}
          >
            Vente a l'atelier,{' '}
            <em className="italic" style={{ color: '#A67C52' }}>
              sur commande
            </em>
          </h2>
          <p className="text-lg leading-[1.7]" style={{ color: '#8B7A6B' }}>
            Uniquement sur commande — merci de reserver minimum 2 jours a l'avance.
          </p>
        </div>

        <div className="animate-on-scroll mb-12">
          <div className="flex flex-col gap-3">
            {days.map((d, i) => (
              <div
                key={d.day}
                className="rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  background: 'white',
                  boxShadow: '0 1px 3px rgba(45,31,20,0.05)',
                  animationDelay: `${i * 0.08}s`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(45,31,20,0.08)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(45,31,20,0.05)'
                }}
              >
                <div className="flex items-center px-6 py-5 md:px-8 md:py-6 gap-4 md:gap-8">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-display text-xl md:text-2xl font-semibold leading-tight"
                      style={{ color: '#2D1F14' }}
                    >
                      {d.day}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      {d.hasViennoiseries ? (
                        <div className="flex items-center gap-1.5">
                          <Wheat size={13} style={{ color: '#B8956A' }} />
                          <span className="text-sm" style={{ color: '#8B7A6B' }}>Pains</span>
                          <span className="text-sm mx-0.5" style={{ color: '#D4BFA5' }}>&</span>
                          <CakeSlice size={13} style={{ color: '#B8956A' }} />
                          <span className="text-sm" style={{ color: '#8B7A6B' }}>Viennoiseries</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Wheat size={13} style={{ color: '#B8956A' }} />
                          <span className="text-sm" style={{ color: '#8B7A6B' }}>Pains</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {d.hours.map((h, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm md:text-base font-medium"
                        style={{ color: '#2D1F14' }}
                      >
                        <Clock size={15} style={{ color: '#A67C52' }} />
                        {h}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-on-scroll">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'white',
              boxShadow: '0 1px 3px rgba(45,31,20,0.05)',
            }}
          >
            <div
              className="px-6 py-4 md:px-8 md:py-5 flex items-center gap-3"
              style={{ borderBottom: '1px solid #F5EDE3' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: '#FDF3E7' }}
              >
                <Wheat size={16} style={{ color: '#A67C52' }} />
              </div>
              <h3
                className="font-display text-lg font-semibold"
                style={{ color: '#2D1F14' }}
              >
                Nos pains
              </h3>
            </div>
            <div className="px-6 py-5 md:px-8 md:py-6">
              <div className="flex flex-wrap gap-2">
                {breads.map((bread) => (
                  <span
                    key={bread}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm"
                    style={{
                      background: '#FDF8F3',
                      color: '#6E4D32',
                      border: '1px solid #F0E4D5',
                    }}
                  >
                    <ChevronRight size={12} style={{ color: '#C4A882' }} />
                    {bread}
                  </span>
                ))}
              </div>
            </div>

            <div
              className="px-6 py-4 md:px-8 md:py-5 flex items-center gap-3"
              style={{ borderTop: '1px solid #F5EDE3', borderBottom: '1px solid #F5EDE3' }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: '#FDF3E7' }}
              >
                <CakeSlice size={16} style={{ color: '#A67C52' }} />
              </div>
              <h3
                className="font-display text-lg font-semibold"
                style={{ color: '#2D1F14' }}
              >
                Viennoiseries
              </h3>
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full ml-auto"
                style={{ background: 'linear-gradient(135deg, #A67C52, #8B6340)', color: 'white' }}
              >
                Samedi
              </span>
            </div>
            <div className="px-6 py-5 md:px-8 md:py-6">
              <div className="flex flex-wrap gap-2">
                {viennoiseries.map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm"
                    style={{
                      background: '#FDF8F3',
                      color: '#6E4D32',
                      border: '1px solid #F0E4D5',
                    }}
                  >
                    <ChevronRight size={12} style={{ color: '#C4A882' }} />
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
