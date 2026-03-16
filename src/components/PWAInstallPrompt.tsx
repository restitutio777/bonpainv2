import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('pwa-install-dismissed')) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    if (!deferredPrompt || dismissed) return

    const section = document.getElementById('order')
    if (!section) return

    let timer: ReturnType<typeof setTimeout> | null = null

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => setVisible(true), 4000)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(section)

    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [deferredPrompt, dismissed])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted' || outcome === 'dismissed') {
      setVisible(false)
      setDismissed(true)
      localStorage.setItem('pwa-install-dismissed', '1')
    }
  }

  const handleDismiss = () => {
    setVisible(false)
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', '1')
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2.5rem)] max-w-sm"
      style={{
        animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <div
        className="flex items-center gap-4 px-5 py-4 rounded-2xl"
        style={{
          background: '#2D1F14',
          boxShadow: '0 8px 32px rgba(45,31,20,0.35)',
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
          style={{ background: 'rgba(166,124,82,0.2)' }}
        >
          <Download size={18} style={{ color: '#D4A96A' }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight" style={{ color: '#FAF6F1' }}>
            Ajouter à l'écran d'accueil
          </p>
          <p className="text-xs leading-tight mt-0.5" style={{ color: '#8B7A6B' }}>
            Commandez plus vite la prochaine fois
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstall}
            className="px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200"
            style={{ background: '#A67C52', color: 'white' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#8B6340')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#A67C52')}
          >
            Installer
          </button>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-200"
            style={{ color: '#6E4D32' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#FAF6F1')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#6E4D32')}
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
