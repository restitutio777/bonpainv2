import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import { OPEN_INSTALL_EVENT, promptInstall, useInstallMode } from '../lib/pwaInstall'

// Banner offering to install the site as an app (see src/lib/pwaInstall.ts).
// Android/Chrome: "Installer" opens the browser's install dialog directly.
// iPhone/iPad: Safari has no install API, so the banner shows the two taps.
// It appears on its own on phones once the visitor has scrolled a screen or
// stayed 15 s, and comes back 30 days after being closed. The footer link
// opens it at any time.

const DISMISS_KEY = 'pwa-install-dismissed'
const DISMISS_DAYS = 30

function dismissedRecently(): boolean {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY))
    // Older versions stored "1" for good; that counts as expired now.
    return t > 1e12 && Date.now() - t < DISMISS_DAYS * 24 * 3600 * 1000
  } catch {
    return false
  }
}

function rememberDismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  } catch {
    // private mode: the banner may come back, nothing worse
  }
}

const isPhone = () => window.matchMedia('(pointer: coarse)').matches

export default function PWAInstallPrompt() {
  const mode = useInstallMode()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const open = () => setVisible(true)
    window.addEventListener(OPEN_INSTALL_EVENT, open)
    return () => window.removeEventListener(OPEN_INSTALL_EVENT, open)
  }, [])

  useEffect(() => {
    if (mode === 'none' || !isPhone() || dismissedRecently()) return
    let shown = false
    const show = () => {
      if (shown) return
      shown = true
      setVisible(true)
    }
    const onScroll = () => {
      if (window.scrollY > window.innerHeight) show()
    }
    const timer = setTimeout(show, 15000)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [mode])

  if (!visible || mode === 'none') return null

  const close = () => {
    setVisible(false)
    rememberDismiss()
  }

  const install = async () => {
    const outcome = await promptInstall()
    setVisible(false)
    if (outcome === 'dismissed') rememberDismiss()
  }

  return (
    <div
      role="dialog"
      aria-label="Installer l'application"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm"
      style={{ animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <div
        className="flex items-center gap-4 px-5 py-4 rounded-2xl"
        style={{ background: '#2D1F14', boxShadow: '0 8px 32px rgba(45,31,20,0.35)' }}
      >
        <img
          src="/icons/apple-touch-icon.png"
          alt=""
          width={40}
          height={40}
          className="w-10 h-10 rounded-xl flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight" style={{ color: '#FAF6F1' }}>
            L&rsquo;app Bon Pain
          </p>
          {mode === 'prompt' ? (
            <p className="text-xs leading-snug mt-0.5" style={{ color: '#BFA07E' }}>
              Sur votre écran d&rsquo;accueil.
            </p>
          ) : (
            <p className="text-xs leading-snug mt-0.5" style={{ color: '#BFA07E' }}>
              Touchez{' '}
              <Share size={13} className="inline -mt-0.5" aria-label="Partager" style={{ color: '#FAF6F1' }} />{' '}
              <span style={{ color: '#FAF6F1' }}>Partager</span>, puis{' '}
              <span style={{ color: '#FAF6F1' }}>«&nbsp;Sur l&rsquo;écran d&rsquo;accueil&nbsp;»</span>. Sur iPhone,
              Partager se trouve parfois sous «&nbsp;•••&nbsp;».
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {mode === 'prompt' && (
            <button
              onClick={install}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors duration-200"
              style={{ background: '#A67C52', color: 'white' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#8B6340')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#A67C52')}
            >
              <Download size={14} />
              Installer
            </button>
          )}
          <button
            onClick={close}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors duration-200"
            style={{ color: '#BFA07E' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#FAF6F1')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#BFA07E')}
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
