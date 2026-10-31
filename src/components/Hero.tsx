import { ShoppingBag } from 'lucide-react'
import WheatIcon from './WheatIcon'
import { useSanity } from '../context/SanityContext'
import { sanitySrcSet } from '../lib/sanity'
import heroFallback from '../assets/mood/couronne-1200.webp'

// The photo sits under a dark gradient, so q=70 is enough. Phones get 640 to
// 1280 px instead of the full-size file.
const HERO_WIDTHS = [640, 960, 1280, 1920, 2400]

export default function Hero() {
  const { content } = useSanity()

  const badge = content?.heroBadge || 'Boulangerie Artisanale \u2014 Sourbrodt'
  // "Boulangerie Artisanale - Sourbrodt": the wheat icon replaces the dash.
  const badgeParts = badge.split(/\s+[-\u2013\u2014\u00b7|]\s+/)
  const title = content?.heroTitle || 'Pain au levain,'
  const titleAccent = content?.heroTitleAccent || 'fait \u00e0 la main'
  const subtitle =
    content?.heroSubtitle ||
    "Levain naturel cultiv\u00e9 sur place, farines soigneusement s\u00e9lectionn\u00e9es et fermentation longue : ici, nous prenons le temps de faire du bon pain, tout simplement."
  const ctaPrimary = content?.heroCtaPrimary || 'Commander maintenant'
  const ctaSecondary = content?.heroCtaSecondary || 'Voir nos pains'

  const heroUrl = content?.heroImage

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden hero-grain"
      style={{ background: '#2D1F14' }}
    >
      <div
        className="absolute inset-0 scale-105"
        style={{ animation: 'fadeIn 1.5s ease forwards' }}
      >
        <img
          src={heroUrl ? `${heroUrl}?w=1280&auto=format&fit=max&q=70` : heroFallback}
          srcSet={heroUrl ? sanitySrcSet(heroUrl, HERO_WIDTHS, 70) : undefined}
          sizes="100vw"
          alt=""
          decoding="async"
          // React 18 does not know the camelCase prop yet.
          {...{ fetchpriority: 'high' }}
          // Portrait phones show only a narrow strip of the landscape photo; the
          // loaf sits right of centre, so shift the crop towards it there.
          className="absolute inset-0 w-full h-full object-cover object-[65%_50%] md:object-center"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(45,31,20,0.65) 0%, rgba(45,31,20,0.72) 50%, rgba(45,31,20,0.88) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 text-center text-white max-w-[800px] px-6">
        <div
          className="inline-flex items-center justify-center gap-[0.7em] whitespace-nowrap px-[1.4em] py-[0.6em] rounded-full font-semibold uppercase tracking-[0.14em] leading-none mb-6 sm:mb-8"
          style={{
            // One line on every phone: the size follows the viewport down to
            // 320 px instead of wrapping and pushing the CTAs down.
            fontSize: 'clamp(0.625rem, 2.85vw, 0.75rem)',
            background: 'rgba(166,124,82,0.28)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(212,163,115,0.45)',
            color: '#F0DCC4',
            animation: 'fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s both',
          }}
        >
          {badgeParts.length > 1 ? (
            <>
              <span>{badgeParts[0]}</span>
              <WheatIcon size={13} className="shrink-0" style={{ color: '#D4A373' }} />
              <span className="sr-only"> – </span>
              <span>{badgeParts.slice(1).join(' ')}</span>
            </>
          ) : (
            <>
              <WheatIcon size={13} className="shrink-0" style={{ color: '#D4A373' }} />
              <span>{badge}</span>
            </>
          )}
        </div>

        <h1
          className="font-display font-light leading-[1.05] tracking-tight mb-6"
          style={{
            fontSize: 'clamp(3rem, 7vw, 5.5rem)',
            textWrap: 'balance',
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
            maxWidth: '560px',
            textWrap: 'pretty',
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
            href="#products"
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

      <a
        href="#about"
        aria-label="Découvrir notre histoire"
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 no-underline transition-colors duration-300 hover:text-white"
        style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: '0.7rem',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          animation: 'fadeIn 1s ease 1.5s both',
        }}
      >
        <span>Notre histoire</span>
        <div
          className="w-px h-10"
          style={{
            background: 'linear-gradient(to bottom, currentColor, transparent)',
            animation: 'floatWheat 2s ease-in-out infinite',
          }}
        />
      </a>
    </section>
  )
}
