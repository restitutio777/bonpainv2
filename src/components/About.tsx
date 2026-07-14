import { useEffect } from 'react'
import { useSanity } from '../context/SanityContext'

type Mood = { webp: string; jpg: string; alt: string }

// Trois photos réelles de la boulangerie, dans l'ordre du récit :
// artisanat (Baraque Michel) → l'enseigne (Sourbrodt) → le pain d'aujourd'hui.
const MOOD: Mood[] = [
  {
    webp: '/BAEKEREI_346_1.webp',
    jpg: '/BAEKEREI_346_1.JPG',
    alt: 'Benjamin présente une couronne de pain au levain, tout juste sortie du four',
  },
  {
    webp: '/bon-pain-fait-main-boulangerie.webp',
    jpg: '/bon-pain-fait-main-boulangerie.jpg',
    alt: "L'enseigne « Bon Pain Fait Main, artisan boulanger », entourée de vigne",
  },
  {
    webp: '/BAEKEREI_564_1.webp',
    jpg: '/BAEKEREI_564_1.JPG',
    alt: 'Baguettes tradition dorées, alignées sur la grille à la sortie du four',
  },
]

export default function About() {
  const { content } = useSanity()

  const label = content?.aboutLabel || 'Notre histoire'
  const title = content?.aboutTitle || 'Benjamin & Nadia,'
  const titleAccent = content?.aboutTitleAccent || 'à Sourbrodt'
  const paras: string[] = content?.aboutText
    ? content.aboutText
        .filter((b) => b._type === 'block')
        .map((b) => (b.children || []).map((c) => c.text || '').join(''))
        .filter(Boolean)
    : [
        "À Sourbrodt, au cœur des Fagnes, Benjamin et Nadia tiennent une petite boulangerie. Farines choisies, levain naturel cultivé sur place, fermentation longue de 24 heures, cuisson sur commande. Pas de raccourci, pas d'invendu — c'est cette lenteur assumée qui fait la différence dans la mie et dans le goût.",
      ]

  // Récit : premier paragraphe en chapô, dernier en citation de clôture,
  // le reste réparti autour des trois photos (chapitres alternés).
  const lead = paras[0]
  const hasClosing = paras.length >= 5
  const closing = hasClosing ? paras[paras.length - 1] : undefined
  const middle = paras.slice(1, hasClosing ? -1 : undefined)

  const chapters: { paras: string[]; img: Mood }[] = []
  if (middle.length) {
    const groups = Math.min(MOOD.length, middle.length)
    const base = Math.floor(middle.length / groups)
    const extra = middle.length % groups
    let idx = 0
    for (let g = 0; g < groups; g++) {
      const size = base + (g < extra ? 1 : 0)
      chapters.push({ paras: middle.slice(idx, idx + size), img: MOOD[g] })
      idx += size
    }
  }

  // Observateur local : les chapitres n'existent qu'une fois le contenu chargé,
  // l'observateur global (monté une seule fois) les manquerait sinon.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    document
      .querySelectorAll('#about .animate-on-scroll')
      .forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [chapters.length, Boolean(closing)])

  return (
    <section id="about" className="py-28 lg:py-36" style={{ background: '#FAF6F1' }}>
      <div className="container mx-auto px-5 md:px-10 max-w-[1100px]">
        {/* En-tête + chapô */}
        <div className="animate-on-scroll text-center max-w-[720px] mx-auto">
          <div
            className="text-xs font-semibold uppercase tracking-[0.15em] mb-4"
            style={{ color: '#A67C52' }}
          >
            {label}
          </div>
          <h2
            className="font-display font-normal leading-[1.15] tracking-tight mb-6"
            style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', color: '#2D1F14', textWrap: 'balance' }}
          >
            {title}{' '}
            <em className="not-italic italic" style={{ color: '#A67C52' }}>
              {titleAccent}
            </em>
          </h2>
          {lead && (
            <p
              className="mx-auto"
              style={{
                fontSize: 'clamp(1.15rem, 1.6vw, 1.3rem)',
                lineHeight: 1.85,
                color: '#6E4D32',
                maxWidth: '42rem',
                textWrap: 'pretty',
              }}
            >
              {lead}
            </p>
          )}
        </div>

        {/* Chapitres : photo + texte, côtés alternés */}
        <div className="mt-16 lg:mt-28 space-y-16 lg:space-y-28">
          {chapters.map((ch, i) => {
            const imgRight = i % 2 === 1
            return (
              <div
                key={i}
                className="animate-on-scroll grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
              >
                <figure className={`relative m-0 ${imgRight ? 'lg:order-2' : ''}`}>
                  <div
                    className="relative overflow-hidden rounded-[20px]"
                    style={{ aspectRatio: '4 / 3', boxShadow: '0 16px 48px rgba(45,31,20,0.12)' }}
                  >
                    <picture>
                      <source srcSet={ch.img.webp} type="image/webp" />
                      <img
                        src={ch.img.jpg}
                        alt={ch.img.alt}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </picture>
                  </div>
                  {i === 0 && (
                    <div
                      className="hidden lg:block absolute -bottom-5 -left-5 w-28 h-28 rounded-[20px] -z-10"
                      style={{ border: '2px solid #D4BFA5' }}
                    />
                  )}
                </figure>
                <div className={imgRight ? 'lg:order-1' : ''}>
                  {ch.paras.map((p, j) => (
                    <p
                      key={j}
                      className="leading-[1.8] mb-4 last:mb-0"
                      style={{ fontSize: '1.1rem', color: '#6E4D32', textWrap: 'pretty' }}
                    >
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Citation de clôture */}
        {closing && (
          <div className="animate-on-scroll text-center max-w-[760px] mx-auto mt-16 lg:mt-28">
            <div className="mx-auto mb-8 h-px w-16" style={{ background: '#D4BFA5' }} />
            <p
              className="font-display italic"
              style={{
                fontSize: 'clamp(1.4rem, 2.4vw, 2rem)',
                lineHeight: 1.4,
                color: '#2D1F14',
                textWrap: 'balance',
              }}
            >
              {closing}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
