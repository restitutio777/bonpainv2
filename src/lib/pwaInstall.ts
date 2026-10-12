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
// do there is show the way. The in-app browsers of Facebook and Instagram
// (where many customers arrive) cannot install at all: the page first has to
// be opened in the real browser.

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

export type InstallMode = 'prompt' | 'ios' | 'inapp' | 'none'

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
  if (isInAppBrowser()) return 'inapp'
  if (isIOS()) return 'ios'
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

// Asks the install overlay (PWAInstallPrompt) to open.
//   manual  — a button the visitor pressed: always opens
//   ordered — right after an order: opens unless closed in the last day
export type InstallReason = 'manual' | 'ordered'
export const OPEN_INSTALL_EVENT = 'bonpain:install'
export const openInstall = (reason: InstallReason = 'manual') =>
  window.dispatchEvent(new CustomEvent<InstallReason>(OPEN_INSTALL_EVENT, { detail: reason }))

/** For buttons: Chrome/Android straight to the browser's dialog (one tap), otherwise the explaining overlay. */
export function installFromButton(mode: InstallMode) {
  if (mode === 'prompt') void promptInstall()
  else openInstall('manual')
}
