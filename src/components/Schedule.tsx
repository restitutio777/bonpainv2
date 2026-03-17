import { Clock, CakeSlice } from 'lucide-react'
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
    hours: '8:00 - 12:00',
    note: null,
    hasViennoiseries: false,
  },
  {
    day: 'Vendredi',
    hours: '8:00 - 12:00 & 13:00 - 15:00',
    note: null,
    hasViennoiseries: false,
  },
  {
    day: 'Samedi',
    hours: '8:00 - 12:00',
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {days.map((d, i) => (
            <div
              key={d.day}
              className="animate-on-scroll rounded-[20px] overflow-hidden transition-shadow duration-300"
              style={{
                background: 'white',
                boxShadow: '0 1px 3px rgba(45,31,20,0.06)',
                transitionDelay: `${i * 0.1}s`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(45,31,20,0.08)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(45,31,20,0.06)'
              }}
            >
              <div
                className="px-8 py-5 flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg, #A67C52, #8B6340)' }}
              >
                <div>
                  <h3 className="font-display text-2xl font-semibold" style={{ color: 'white' }}>
                    {d.day}
                  </h3>
                  {d.note && (
                    <span className="text-xs font-medium mt-0.5 block" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {d.note}
                    </span>
                  )}
                </div>
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-right whitespace-nowrap"
                  style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
                >
                  <Clock size={14} className="flex-shrink-0" />
                  <span className="flex flex-col leading-tight">
                    {d.hours.includes('&') ? (
                      d.hours.split('&').map((part, idx) => (
                        <span key={idx}>{part.trim()}</span>
                      ))
                    ) : (
                      d.hours
                    )}
                  </span>
                </div>
              </div>

              <div className="p-8">
                <div
                  className="text-xs font-semibold uppercase tracking-[0.12em] mb-4"
                  style={{ color: '#A67C52' }}
                >
                  Pains disponibles
                </div>
                <ul className="list-none p-0 space-y-0">
                  {breads.map((bread) => (
                    <li
                      key={bread}
                      className="py-2 text-[0.95rem] leading-[1.5] flex items-center gap-2.5"
                      style={{ borderBottom: '1px solid #F5EDE3', color: '#6E4D32' }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: '#D4BFA5' }}
                      />
                      {bread}
                    </li>
                  ))}
                </ul>

                {d.hasViennoiseries && (
                  <div className="mt-6">
                    <div
                      className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] mb-4"
                      style={{ color: '#A67C52' }}
                    >
                      <CakeSlice size={14} />
                      Viennoiseries
                    </div>
                    <ul className="list-none p-0 space-y-0">
                      {viennoiseries.map((v) => (
                        <li
                          key={v}
                          className="py-2 text-[0.95rem] leading-[1.5] flex items-center gap-2.5"
                          style={{ borderBottom: '1px solid #F5EDE3', color: '#6E4D32' }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: '#A67C52' }}
                          />
                          {v}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
