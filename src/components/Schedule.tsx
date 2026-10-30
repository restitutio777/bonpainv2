import { Clock, CakeSlice, Wheat } from 'lucide-react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { useSanity } from '../context/SanityContext'
import { dayLabelFr, formatTimeFr, isViennoiserieDay, openDays } from '../lib/schedule'

// Shown until the CMS schedule loads (or if it is empty).
const FALLBACK_DAYS = [
  {
    day: 'Mercredi',
    hours: ['8h — 12h', '13h — 15h'],
    hasViennoiseries: true,
  },
  {
    day: 'Vendredi',
    hours: ['8h — 12h', '13h — 17h'],
    hasViennoiseries: true,
  },
  {
    day: 'Samedi',
    hours: ['8h — 12h'],
    hasViennoiseries: true,
  },
]

export default function Schedule() {
  useScrollAnimation()
  const { schedule, settings } = useSanity()
  const orderLeadDays = settings?.orderLeadDays || 2
  const facebookUrl = settings?.facebookUrl

  const cmsDays = openDays(schedule).map((s) => ({
    day: dayLabelFr(s.day),
    hours: (s.slots || []).map(
      (slot) => `${formatTimeFr(slot.open, 'short')} — ${formatTimeFr(slot.close, 'short')}`
    ),
    hasViennoiseries: isViennoiserieDay(s),
  }))

  const days = cmsDays.length > 0 ? cmsDays : FALLBACK_DAYS

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
            Vente sur commande{' '}
            <em className="italic" style={{ color: '#A67C52' }}>
              et à l'atelier
            </em>
          </h2>
          <p className="text-lg leading-[1.7]" style={{ color: '#8B7A6B' }}>
            Pour les commandes, merci de réserver minimum {orderLeadDays} jours à l'avance.
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

        {facebookUrl && (
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="animate-on-scroll flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-base no-underline transition-colors duration-200"
            style={{ background: 'white', border: '1px dashed #D4BFA5', color: '#6E4D32' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-shrink-0"
              style={{ color: '#A67C52' }}
              aria-hidden="true"
            >
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
            <span>
              Pain du moment, nouveautés, fermetures exceptionnelles :{' '}
              <span className="font-semibold underline underline-offset-4" style={{ color: '#A67C52' }}>
                suivez-nous sur Facebook
              </span>
            </span>
          </a>
        )}
      </div>
    </section>
  )
}
