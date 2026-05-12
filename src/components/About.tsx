import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { useSanity } from '../context/SanityContext'

export default function About() {
  useScrollAnimation()
  const { content } = useSanity()

  const label = content?.aboutLabel || 'Notre histoire'
  const title = content?.aboutTitle || 'Benjamin & Nadia,'
  const titleAccent = content?.aboutTitleAccent || 'à Sourbrodt'
  const aboutText = content?.aboutText
    ? content.aboutText
        .filter((b: any) => b._type === 'block')
        .map((b: any) => (b.children || []).map((c: any) => c.text || '').join(''))
        .filter(Boolean)
    : [
        "À Sourbrodt, au cœur des Fagnes, Benjamin et Nadia tiennent une petite boulangerie. Farines choisies, levain naturel cultivé sur place, fermentation longue de 24 heures, cuisson sur commande. Pas de raccourci, pas d'invendu — c'est cette lenteur assumée qui fait la différence dans la mie et dans le goût.",
      ]
  const aboutImage = content?.aboutImage || 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800&q=80'
  const aboutImageAlt = content?.aboutImageAlt || 'Benjamin et Nadia au fournil'

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
                src={aboutImage}
                alt={aboutImageAlt}
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
              {label}
            </div>
            <h2
              className="font-display font-normal leading-[1.15] tracking-tight mb-6"
              style={{
                fontSize: 'clamp(2.2rem, 4vw, 3.5rem)',
                color: '#2D1F14',
                textWrap: 'balance',
              }}
            >
              {title}{' '}
              <em className="not-italic italic" style={{ color: '#A67C52' }}>
                {titleAccent}
              </em>
            </h2>
            {aboutText.map((paragraph, i) => (
              <p
                key={i}
                className="leading-[1.8] mb-4"
                style={{
                  fontSize: '1.1rem',
                  color: '#6E4D32',
                  textWrap: 'pretty',
                }}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
