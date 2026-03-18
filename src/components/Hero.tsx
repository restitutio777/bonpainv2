import { ShoppingBag } from 'lucide-react'
import WheatIcon from './WheatIcon'
import { useSanity } from '../context/SanityContext'

export default function Hero() {
  const { content } = useSanity()

  const badge = content?.heroBadge || 'Boulangerie Artisanale \u2014 Waimes'
  const title = content?.heroTitle || 'Du pain'
  const titleAccent = content?.heroTitleAccent || 'au levain,'
  const subtitle = content?.heroSubtitle || 'Benjamin fa\u00e7onne chaque pain sur commande, avec des farines locales et un levain cultiv\u00e9 avec soin. Rien de plus, rien de moins.'
  const ctaPrimary = content?.heroCtaPrimary || 'Commander maintenant'
  const ctaSecondary = content?.heroCtaSecondary || 'D\u00e9couvrir notre histoire'

  const bgStyle = content?.heroImage
    ? `linear-gradient(180deg, rgba(45,31,20,0.65) 0%, rgba(45,31,20,0.72) 50%, rgba(45,31,20,0.88) 100%), url('${content.heroImage}') center/cover no-repeat`
    : `linear-gradient(180deg, rgba(45,31,20,0.65) 0%, rgba(45,31,20,0.72) 50%, rgba(45,31,20,0.88) 100%), url('https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1600&q=80') center/cover no-repeat`

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden hero-grain"
      style={{ background: '#2D1F14' }}
    >
      <div
        className="absolute inset-0 scale-105"
        style={{
          background: bgStyle,
          animation: 'fadeIn 1.5s ease forwards',
        }}
      />

      <div className="relative z-10 text-center text-white max-w-[800px] px-6">
        <div
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.15em] mb-8"
          style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#E8D9C8',
            animation: 'fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s both',
          }}
        >
          <WheatIcon size={14} />
          {badge}
        </div>

        <h1
          className="font-display font-light leading-[1.05] tracking-tight mb-6"
          style={{
            fontSize: 'clamp(3rem, 7vw, 5.5rem)',
            animation: 'fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.5s both',
          }}
        >
          {title}{' '}
          <em className="not-italic font-normal italic" style={{ color: '#D4A373' }}>
            {titleAccent}
          </em>
        </h1>

        <p
          className="mx-auto mb-10 leading-[1.7]"
          style={{
            fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
            color: 'rgba(255,255,255,0.75)',
            maxWidth: '520px',
            animation: 'fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.7s both',
          }}
        >
          {subtitle}
        </p>

        <div
          className="flex gap-4 justify-center flex-wrap"
          style={{ animation: 'fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.9s both' }}
        >
          <a
            href="#order"
            className="inline-flex items-center gap-2.5 px-9 py-4 rounded-full text-sm font-semibold uppercase tracking-widest text-white no-underline transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: '#A67C52',
              boxShadow: '0 4px 20px rgba(166,124,82,0.4)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#8B6340';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 30px rgba(166,124,82,0.5)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#A67C52';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(166,124,82,0.4)';
            }}
          >
            <ShoppingBag size={18} />
            {ctaPrimary}
          </a>
          <a
            href="#about"
            className="inline-flex items-center gap-2.5 px-9 py-4 rounded-full text-sm font-medium uppercase tracking-widest text-white no-underline transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {ctaSecondary}
          </a>
        </div>
      </div>

      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
        style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: '0.7rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          animation: 'fadeIn 1s ease 1.5s both',
        }}
      >
        <span>D\u00e9filer</span>
        <div
          className="w-px h-10"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
            animation: 'floatWheat 2s ease-in-out infinite',
          }}
        />
      </div>
    </section>
  )
}
