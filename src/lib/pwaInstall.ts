import { useSyncExternalStore } from 'react'

// Installing the site as an app.
//
// Chrome, Edge and Samsung Internet (Android and desktop) fire
// `beforeinstallprompt` once, often before React has mounted; main.tsx
// imports this module first so the event is never missed. Calling prompt()
// on it opens the browser's own install dialog: one tap on our button, one
// confirmation in the browser's dialog. No site can skip that confirmation.
//
// Safari on iPhone/iPad has no such event and no API at all: installing is
// only possible through Share → "Sur l'écran d'accueil". The best a site can
// do there is show the way.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // our button instead of the browser's mini-infobar
    deferred = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    installed = true
    notify()
  })
}

export type InstallMode = 'prompt' | 'ios' | 'none'

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIOS(): boolean {
  const ua = navigator.userAgent
  // iPadOS reports itself as a Mac; the touch screen gives it away.
  return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/** Facebook, Instagram & co. open links in their own browser, which cannot install apps. */
export function isInAppBrowser(): boolean {
  return /FBAN|FBAV|FB_IAB|Instagram|Line\/|; wv\)/.test(navigator.userAgent)
}

function currentMode(): InstallMode {
  if (installed || isStandalone()) return 'none'
  if (deferred) return 'prompt'
  if (isIOS() && !isInAppBrowser()) return 'ios'
  return 'none'
}

/** How this browser can install the site right now. Re-renders when that changes. */
export function useInstallMode(): InstallMode {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    currentMode,
    () => 'none'
  )
}

/** Opens the browser's install dialog. The event can be used only once. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const e = deferred
  if (!e) return 'unavailable'
  deferred = null
  await e.prompt()
  const { outcome } = await e.userChoice
  notify()
  return outcome
}

// Lets any button (footer, menu) open the install banner, even after it was dismissed.
export const OPEN_INSTALL_EVENT = 'bonpain:install'
export const openInstall = () => window.dispatchEvent(new Event(OPEN_INSTALL_EVENT))
