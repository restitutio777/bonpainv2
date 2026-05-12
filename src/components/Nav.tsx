import { useState, useEffect } from 'react'
import { ShoppingBag, Menu, X, Phone } from 'lucide-react'
import { useSanity } from '../context/SanityContext'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { settings } = useSanity()

  const bakeryName = settings?.bakeryName || 'Bon Pain Fait Main'
  const phone = settings?.phone || '+32 493 21 09 25'
  const phoneHref = `tel:${phone.replace(/\s/g, '')}`

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
          <a
            href="#"
            className="flex items-center no-underline"
            aria-label={bakeryName}
          >
            <picture>
              <source srcSet="/bonpainfaitmain-logo.webp" type="image/webp" />
              <img
                src="/bonpainfaitmain-logo.png"
                alt={bakeryName}
                width={320}
                height={252}
                className="h-14 lg:h-16 w-auto"
                style={{
                  filter: scrolled ? 'brightness(0)' : 'none',
                  transition: 'filter 500ms ease',
                }}
              />
            </picture>
          </a>

          <ul className="hidden md:flex items-center gap-6 lg:gap-9 list-none">
            {links.map((link) => (
              <li key={link.href} className="whitespace-nowrap">
                <a
                  href={link.href}
                  className="relative text-sm lg:text-base font-medium uppercase tracking-wide no-underline transition-colors duration-300 group whitespace-nowrap"
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
                href={phoneHref}
                aria-label={`Appeler ${phone}`}
                title={phone}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full no-underline transition-all duration-300 hover:-translate-y-px"
                style={{
                  border: `1px solid ${scrolled ? '#D4BFA5' : 'rgba(255,255,255,0.4)'}`,
                  color: scrolled ? '#6E4D32' : 'rgba(255,255,255,0.85)',
                }}
              >
                <Phone size={16} />
              </a>
            </li>
            <li>
              <a
                href="#order"
                className="inline-flex items-center gap-2 px-5 lg:px-6 py-2.5 rounded-full text-xs lg:text-sm font-semibold uppercase tracking-widest no-underline text-white transition-all duration-300 hover:-translate-y-px whitespace-nowrap"
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

          <div className="md:hidden flex items-center gap-1">
            <a
              href={phoneHref}
              aria-label={`Appeler ${phone}`}
              className="p-2 transition-colors"
              style={{ color: scrolled ? '#2D1F14' : 'white' }}
            >
              <Phone size={22} />
            </a>
            <button
              className="p-2 transition-colors"
              style={{ color: scrolled ? '#2D1F14' : 'white' }}
              onClick={() => setMobileOpen(true)}
              aria-label="Menu"
            >
              <Menu size={24} />
            </button>
          </div>
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
