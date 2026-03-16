import { Clock, Shield, MapPin, Wheat, Heart, Leaf, Star } from 'lucide-react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'
import { useSanity } from '../context/SanityContext'

const iconMap: Record<string, React.ElementType> = {
  clock: Clock,
  shield: Shield,
  'map-pin': MapPin,
  wheat: Wheat,
  heart: Heart,
  leaf: Leaf,
  star: Star,
}

const defaultValues = [
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
]

export default function About() {
  useScrollAnimation()
  const { content } = useSanity()

  const label = content?.aboutLabel || 'Notre histoire'
  const title = content?.aboutTitle || 'Le goût du'
  const titleAccent = content?.aboutTitleAccent || 'vrai pain'
  const aboutText = content?.aboutText
    ? content.aboutText
        .filter((b: any) => b._type === 'block')
        .map((b: any) => (b.children || []).map((c: any) => c.text || '').join(''))
        .filter(Boolean)
    : [
        "Installé au cœur des Ardennes belges, Benjamin Ramakers a fondé Bon Pain Fait Main avec une conviction simple : le pain mérite du temps, des ingrédients honnêtes et un savoir-faire authentique. Chaque miche est pétrie à la main, levée lentement au levain naturel, et cuite uniquement sur commande — pas de gaspillage, pas de compromis.",
      ]
  const aboutImage = content?.aboutImage || 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800&q=80'
  const aboutImageAlt = content?.aboutImageAlt || 'Benjamin pétrissant le pain'

  const values =
    content?.values && content.values.length > 0
      ? content.values.map((v) => ({
          icon: iconMap[v.icon] || Clock,
          title: v.title,
          text: v.description,
        }))
      : defaultValues

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
              style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', color: '#2D1F14' }}
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
                style={{ fontSize: '1.1rem', color: '#6E4D32' }}
              >
                {paragraph}
              </p>
            ))}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-6">
              {values.map((v) => (
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
                    className="font-display font-semibold text-xl mb-2"
                    style={{ color: '#2D1F14' }}
                  >
                    {v.title}
                  </h3>
                  <p className="text-base leading-[1.6]" style={{ color: '#8B7A6B' }}>
                    {v.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
