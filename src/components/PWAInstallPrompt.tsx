import { useEffect, useRef, useState } from 'react'
import { Check, MoreHorizontal, PlusSquare, Share } from 'lucide-react'
import { OPEN_INSTALL_EVENT, promptInstall, useInstallMode, type InstallReason } from '../lib/pwaInstall'

// Full-screen invitation to put the bakery on the phone's home screen (see
// src/lib/pwaInstall.ts for what each browser allows). Written for people
// who have never "installed" a website: no jargon, large text, one reason
// that matters to them (ordering bread from the phone, in one tap).
//
// It opens on its own at two moments, on phones only:
//   - the visitor has been looking at the breads for a few seconds
//     (not while typing in the order form), unless closed in the last 14 days
//   - right after an order went through, unless closed in the last day
// and at most once per visit. Buttons in the menu and the footer open it any time.

const DISMISS_KEY = 'pwa-install-dismissed'
const SESSION_KEY = 'pwa-install-shown'
const DAY = 24 * 3600 * 1000

function dismissedWithin(ms: number): boolean {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY))
    // Older versions stored "1"; that counts as expired.
    return t > 1e12 && Date.now() - t < ms
  } catch {
    return false
  }
}

function remember(key: 'dismiss' | 'session') {
  try {
    if (key === 'dismiss') localStorage.setItem(DISMISS_KEY, String(Date.now()))
    else sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    // private mode: at worst the invitation comes back
  }
}

function shownThisVisit(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

const isPhone = () => window.matchMedia('(pointer: coarse)').matches
const typingInForm = () => !!document.activeElement?.closest('#order form')

function Step({ n, children, note }: { n: number; children: React.ReactNode; note?: string }) {
  return (
    <li className="flex items-start gap-4">
      <span
        className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full font-semibold text-base"
        style={{ background: '#A67C52', color: 'white' }}
        aria-hidden="true"
      >
        {n}
      </span>
      <div className="pt-1">
        <p className="text-[17px] leading-snug" style={{ color: '#2D1F14' }}>
          {children}
        </p>
        {note && (
          <p className="text-sm leading-snug mt-1" style={{ color: '#8B7A6B' }}>
            {note}
          </p>
        )}
      </div>
    </li>
  )
}

const Key = ({ children }: { children: React.ReactNode }) => (
  <span
    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md align-middle font-semibold whitespace-nowrap"
    style={{ background: '#F0E5D8', color: '#2D1F14' }}
  >
    {children}
  </span>
)

export default function PWAInstallPrompt() {
  const mode = useInstallMode()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<InstallReason | 'engaged'>('engaged')
  const primary = useRef<HTMLButtonElement>(null)

  // Requests from buttons and from the order form.
  useEffect(() => {
    const onRequest = (e: Event) => {
      const why = (e as CustomEvent<InstallReason>).detail ?? 'manual'
      if (why === 'ordered' && (!isPhone() || shownThisVisit() || dismissedWithin(DAY))) return
      setReason(why)
      setOpen(true)
    }
    window.addEventListener(OPEN_INSTALL_EVENT, onRequest)
    return () => window.removeEventListener(OPEN_INSTALL_EVENT, onRequest)
  }, [])

  // On its own: a few seconds after the breads come into view (or after 25 s).
  useEffect(() => {
    if (mode === 'none' || !isPhone() || shownThisVisit() || dismissedWithin(14 * DAY)) return
    let timer: ReturnType<typeof setTimeout> | null = null
    const show = () => {
      if (shownThisVisit()) return
      if (typingInForm()) {
        timer = setTimeout(show, 15000)
        return
      }
      setReason('engaged')
      setOpen(true)
    }
    const fallback = setTimeout(show, 25000)
    const products = document.getElementById('products')
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        clearTimeout(fallback)
        timer = setTimeout(show, 6000)
      },
      { threshold: 0.25 }
    )
    if (products) observer.observe(products)
    return () => {
      observer.disconnect()
      clearTimeout(fallback)
      if (timer) clearTimeout(timer)
    }
  }, [mode])

  const visible = open && mode !== 'none'

  function later() {
    setOpen(false)
    remember('dismiss')
  }

  // While open: once-per-visit flag, no page scrolling behind, Escape closes, focus on the main button.
  useEffect(() => {
    if (!visible) return
    remember('session')
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') later()
    }
    window.addEventListener('keydown', onKey)
    primary.current?.focus({ preventScroll: true })
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
    }
  }, [visible])

  if (!visible) return null

  const install = async () => {
    const outcome = await promptInstall()
    setOpen(false)
    if (outcome === 'dismissed') remember('dismiss')
  }

  const title =
    reason === 'ordered' ? 'La prochaine fois, commandez en un geste' : 'Votre boulangerie sur votre téléphone'

  return (
    <div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center" role="presentation">
      <style>{`
        @keyframes pwaFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pwaUp { from { transform: translateY(32px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(45,31,20,0.6)', backdropFilter: 'blur(3px)', animation: 'pwaFade 0.3s ease' }}
        onClick={later}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-title"
        className="relative w-full md:max-w-[440px] max-h-[92vh] overflow-y-auto rounded-t-[28px] md:rounded-[28px] px-6 pt-4"
        style={{
          background: '#FDF8F3',
          boxShadow: '0 -8px 40px rgba(45,31,20,0.25)',
          animation: 'pwaUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          paddingBottom: 'max(1.75rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full md:hidden" style={{ background: '#E8D9C8' }} aria-hidden="true" />

        <div className="flex items-center gap-4 mb-5">
          <img
            src="/icons/apple-touch-icon.png"
            alt=""
            width={64}
            height={64}
            className="w-16 h-16 rounded-2xl flex-shrink-0"
            style={{ boxShadow: '0 4px 14px rgba(45,31,20,0.25)' }}
          />
          <h2 id="pwa-title" className="font-display text-[26px] leading-[1.15] font-medium" style={{ color: '#2D1F14' }}>
            {title}
          </h2>
        </div>

        <p className="text-[17px] leading-relaxed mb-5" style={{ color: '#4A3321' }}>
          Une icône sur l&rsquo;écran d&rsquo;accueil de votre téléphone : vous la touchez, et vous commandez votre
          pain. Plus besoin de chercher notre site.
        </p>

        {/* With steps to show (iPhone, Facebook) the list would push them off a small screen. */}
        {mode === 'prompt' && (
          <ul className="space-y-2 mb-6">
            {['Votre commande en quelques secondes', 'Comme une application, sans store', 'Gratuit, sans inscription'].map(
              (t) => (
                <li key={t} className="flex items-center gap-3 text-base" style={{ color: '#2D1F14' }}>
                  <Check size={20} className="flex-shrink-0" style={{ color: '#5F7F4E' }} />
                  {t}
                </li>
              )
            )}
          </ul>
        )}

        {mode === 'ios' && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: 'white', border: '1px solid #E8D9C8' }}>
            <p className="text-base font-semibold mb-4" style={{ color: '#2D1F14' }}>
              C&rsquo;est fait en 3 gestes :
            </p>
            <ol className="space-y-4">
              <Step n={1} note="En bas de l’écran. Si vous ne le voyez pas, touchez d’abord « ••• ».">
                Touchez{' '}
                <Key>
                  <Share size={17} /> Partager
                </Key>
              </Step>
              <Step n={2} note="Faites glisser la liste vers le haut si besoin.">
                Choisissez{' '}
                <Key>
                  <PlusSquare size={17} /> Sur l&rsquo;écran d&rsquo;accueil
                </Key>
              </Step>
              <Step n={3}>
                Touchez <Key>Ajouter</Key>
              </Step>
            </ol>
          </div>
        )}

        {mode === 'inapp' && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: 'white', border: '1px solid #E8D9C8' }}>
            <p className="text-base font-semibold mb-4" style={{ color: '#2D1F14' }}>
              Vous lisez cette page dans Facebook ou Instagram. Ouvrez-la d&rsquo;abord dans votre navigateur :
            </p>
            <ol className="space-y-4">
              <Step n={1} note="En haut ou en bas de l’écran.">
                Touchez{' '}
                <Key>
                  <MoreHorizontal size={17} /> le menu
                </Key>
              </Step>
              <Step n={2}>Choisissez « Ouvrir dans le navigateur » (Safari ou Chrome)</Step>
              <Step n={3}>Sur la page qui s&rsquo;ouvre, ce message revient avec la suite.</Step>
            </ol>
          </div>
        )}

        {mode === 'prompt' ? (
          <button
            ref={primary}
            type="button"
            onClick={install}
            className="w-full h-14 rounded-full text-base font-semibold text-white transition-colors duration-200"
            style={{ background: '#A67C52', boxShadow: '0 4px 20px rgba(166,124,82,0.35)' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#8B6340')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#A67C52')}
          >
            Ajouter à mon téléphone
          </button>
        ) : (
          <button
            ref={primary}
            type="button"
            onClick={later}
            className="w-full h-14 rounded-full text-base font-semibold text-white"
            style={{ background: '#A67C52', boxShadow: '0 4px 20px rgba(166,124,82,0.35)' }}
          >
            J&rsquo;ai compris
          </button>
        )}
        <button
          type="button"
          onClick={later}
          className="w-full h-12 mt-2 rounded-full text-base font-medium"
          style={{ color: '#6E4D32' }}
        >
          Plus tard
        </button>
      </div>
    </div>
  )
}
