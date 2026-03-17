import { Clock, CakeSlice, Wheat } from 'lucide-react'
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
    hours: ['8:00 - 12:00'],
    note: null,
    hasViennoiseries: false,
  },
  {
    day: 'Vendredi',
    hours: ['8:00 - 12:00', '13:00 - 15:00'],
    note: null,
    hasViennoiseries: false,
  },
  {
    day: 'Samedi',
    hours: ['8:00 - 12:00'],
    note: 'Pains & Viennoiseries',
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
      <div className="container mx-auto px-5 md:px-10 max-w-[1200px]">
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
            <em className="not-italic italic" style={{ color: '#A67C52' }}>
              sur commande
            </em>
          </h2>
          <p className="text-lg leading-[1.7]" style={{ color: '#8B7A6B' }}>
            Uniquement sur commande — merci de reserver minimum 2 jours a l'avance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {days.map((d, i) => (
            <div
              key={d.day}
              className="animate-on-scroll rounded-[20px] overflow-hidden transition-all duration-300 group"
              style={{
                background: 'white',
                boxShadow: '0 1px 3px rgba(45,31,20,0.06)',
                transitionDelay: `${i * 0.1}s`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(45,31,20,0.1)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(45,31,20,0.06)'
              }}
            >
              <div
                className="px-8 pt-8 pb-6 text-center"
                style={{ background: 'linear-gradient(135deg, #A67C52, #8B6340)' }}
              >
                <h3
                  className="font-display text-2xl font-semibold mb-4"
                  style={{ color: 'white' }}
                >
                  {d.day}
                </h3>
                <div className="flex flex-col items-center gap-2">
                  {d.hours.map((h, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                      style={{ background: 'rgba(255,255,255,0.18)', color: 'white' }}
                    >
                      <Clock size={14} />
                      {h}
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-8 py-5">
                {d.note ? (
                  <div className="flex items-center justify-center gap-2">
                    <CakeSlice size={15} style={{ color: '#A67C52' }} />
                    <span
                      className="text-sm font-medium"
                      style={{ color: '#A67C52' }}
                    >
                      {d.note}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Wheat size={15} style={{ color: '#A67C52' }} />
                    <span
                      className="text-sm font-medium"
                      style={{ color: '#A67C52' }}
                    >
                      Pains
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div
          className="animate-on-scroll rounded-[20px] p-8 md:p-10"
          style={{
            background: 'white',
            boxShadow: '0 1px 3px rgba(45,31,20,0.06)',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div>
              <div
                className="text-xs font-semibold uppercase tracking-[0.12em] mb-5 flex items-center gap-2"
                style={{ color: '#A67C52' }}
              >
                <Wheat size={14} />
                Nos pains
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-0">
                {breads.map((bread, idx) => (
                  <div
                    key={bread}
                    className="py-2.5 text-[0.95rem] leading-[1.5] flex items-center gap-2.5"
                    style={{
                      borderBottom: idx < breads.length - (breads.length % 2 === 0 ? 2 : 1) ? '1px solid #F5EDE3' : 'none',
                      color: '#6E4D32',
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: '#D4BFA5' }}
                    />
                    {bread}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div
                className="text-xs font-semibold uppercase tracking-[0.12em] mb-5 flex items-center gap-2"
                style={{ color: '#A67C52' }}
              >
                <CakeSlice size={14} />
                Viennoiseries
                <span
                  className="text-[0.65rem] font-medium normal-case tracking-normal ml-1 px-2 py-0.5 rounded-full"
                  style={{ background: '#FDF3E7', color: '#A67C52' }}
                >
                  Samedi uniquement
                </span>
              </div>
              <div className="space-y-0">
                {viennoiseries.map((v, idx) => (
                  <div
                    key={v}
                    className="py-2.5 text-[0.95rem] leading-[1.5] flex items-center gap-2.5"
                    style={{
                      borderBottom: idx < viennoiseries.length - 1 ? '1px solid #F5EDE3' : 'none',
                      color: '#6E4D32',
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: '#A67C52' }}
                    />
                    {v}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
