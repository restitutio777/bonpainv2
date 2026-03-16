import { useState, useEffect, CSSProperties } from 'react'
import { ShoppingBag, Menu, X } from 'lucide-react'
import WheatIcon from './WheatIcon'
import { useSanity } from '../context/SanityContext'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { settings } = useSanity()

  const bakeryName = settings?.bakeryName || 'Bon Pain Fait Main'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { href: '#products', label: 'Nos pains' },
    { href: '#info', label: 'Infos' },
    { href: '#about', label: 'Notre histoire' },
  ]

  return (
    <>
      <nav
        className={`relative z-40 h-[88px] transition-all duration-500`}
      >
        <div
          className={`absolute inset-0 transition-all duration-500 ${scrolled ? 'glass-nav' : 'bg-black/30 backdrop-blur-sm'}`}
        />
        <div className="relative container mx-auto px-5 md:px-10 max-w-[1200px] h-full flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 no-underline text-warm-900">
            <WheatIcon
              size={40}
              className="text-warm-500"
              style={{ animation: 'floatWheat 4s ease-in-out infinite' } as CSSProperties}
            />
            <span
              className="font-display text-2xl font-medium tracking-tight"
              style={{ color: scrolled ? '#2D1F14' : 'white' }}
            >
              {bakeryName}
            </span>
          </a>

          <ul className="hidden md:flex items-center gap-9 list-none">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="relative text-base font-medium uppercase tracking-wide no-underline transition-colors duration-300 group"
                  style={{ color: scrolled ? '#6E4D32' : 'rgba(255,255,255,0.85)' }}
                >
                  {link.label}
                  <span
                    className="absolute -bottom-0.5 left-0 h-[1.5px] w-0 group-hover:w-full transition-all duration-300 ease-out"
                    style={{ background: '#A67C52' }}
                  />
                </a>
              </li>
            ))}
            <li>
              <a
                href="#order"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold uppercase tracking-widest no-underline text-white transition-all duration-300 hover:-translate-y-px"
                style={{
                  background: '#A67C52',
                  boxShadow: '0 2px 8px rgba(166,124,82,0.3)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#8B6340';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(166,124,82,0.4)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#A67C52';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(166,124,82,0.3)';
                }}
              >
                <ShoppingBag size={15} />
                Commander
              </a>
            </li>
          </ul>

          <button
            className="md:hidden p-2 transition-colors"
            style={{ color: scrolled ? '#2D1F14' : 'white' }}
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-50 flex flex-col px-10 pt-24 pb-10 transition-opacity duration-300 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(250, 246, 241, 0.98)', backdropFilter: 'blur(20px)' }}
      >
        <button
          className="absolute top-5 right-5 p-2 text-warm-700"
          onClick={() => setMobileOpen(false)}
          aria-label="Fermer"
        >
          <X size={24} />
        </button>
        {[...links, { href: '#order', label: 'Commander' }].map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={() => setMobileOpen(false)}
            className="block py-4 font-display text-3xl font-normal text-warm-900 no-underline border-b border-warm-200 transition-colors hover:text-warm-500"
          >
            {link.label}
          </a>
        ))}
      </div>
    </>
  )
}
