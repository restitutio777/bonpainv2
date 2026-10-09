import { useEffect } from 'react'
import { useSanity } from '../context/SanityContext'
import couronne800 from '../assets/mood/couronne-800.webp'
import couronne1200 from '../assets/mood/couronne-1200.webp'
import couronneJpg from '../assets/mood/couronne.jpg'
import enseigne800 from '../assets/mood/enseigne-800.webp'
import enseigne1200 from '../assets/mood/enseigne-1200.webp'
import baguettes800 from '../assets/mood/baguettes-800.webp'
import baguettes1200 from '../assets/mood/baguettes-1200.webp'
import baguettesJpg from '../assets/mood/baguettes.jpg'

type Mood = { webp: string; jpg: string; alt: string }

// The column is 480 px wide on desktop and the full width on phones.
const MOOD_SIZES = '(min-width: 1100px) 480px, (min-width: 1024px) 44vw, 92vw'

// Trois photos réelles de la boulangerie, dans l'ordre du récit :
// artisanat (Baraque Michel) → l'enseigne (Sourbrodt) → le pain d'aujourd'hui.
const MOOD: Mood[] = [
  {
    webp: `${couronne800} 800w, ${couronne1200} 1200w`,
    jpg: couronneJpg,
    alt: 'Benjamin présente une couronne de pain au levain, tout juste sortie du four',
  },
  {
    webp: `${enseigne800} 800w, ${enseigne1200} 1200w`,
    // Stays in public/: index.html uses it as og:image.
    jpg: '/bon-pain-fait-main-boulangerie.jpg',
    alt: "L'enseigne « Bon Pain Fait Main, artisan boulanger », entourée de vigne",
  },
  {
    webp: `${baguettes800} 800w, ${baguettes1200} 1200w`,
    jpg: baguettesJpg,
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
        "Bienvenue à Sourbrodt (Waimes), au cœur des Fagnes, où Benjamin et Nadia vous accueillent dans leur petite boulangerie artisanale.",
        "Pains sur commande et assortiment du jour, préparés avec soin en petite production. Pour les commandes, nous vous conseillons de réserver de préférence 2 jours à l'avance afin de nous permettre de préparer chaque pain dans les meilleures conditions.",
        "Levain naturel cultivé sur place, farines soigneusement sélectionnées et fermentation longue : ici, nous prenons le temps de faire du bon pain, tout simplement.",
        "Nous vous proposons également un petit choix de viennoiseries faites maison, préparées avec la même attention.",
        "Au plaisir de vous recevoir et de vous faire découvrir nos pains et douceurs artisanales !",
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
  const chapterCount = chapters.length
  const hasClosingPara = Boolean(closing)

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
  }, [chapterCount, hasClosingPara])

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
                      <source srcSet={ch.img.webp} sizes={MOOD_SIZES} type="image/webp" />
                      <img
                        src={ch.img.jpg}
                        alt={ch.img.alt}
                        width={1200}
                        height={900}
                        loading="lazy"
                        decoding="async"
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
