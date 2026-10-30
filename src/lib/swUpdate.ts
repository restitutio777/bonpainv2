// Service worker registration with a prompt-free update.
//
// The worker serves the cached app shell, so after a deploy a returning
// visitor first runs the old code, and an installed app resumed from the
// background never looks for a new one. An order placed from such a page
// used yesterday's logic (seen 2026-10-30: kilo breads without their portion).
//
// Here the page checks for a new worker on load and whenever it comes back
// to the foreground. The new worker takes over at once (skipWaiting and
// clientsClaim in the generated sw.js); the page then reloads itself, but
// only while the visitor has not touched anything yet, so a half-filled
// order form is never thrown away.

const LONG_AWAY_MS = 6 * 60 * 60 * 1000

let touched = false

function markTouched() {
  touched = true
}

if ('serviceWorker' in navigator) {
  for (const type of ['pointerdown', 'keydown', 'input']) {
    window.addEventListener(type, markTouched, { capture: true, passive: true })
  }

  // No controller yet: first visit, the worker's first takeover is no update.
  let hadController = Boolean(navigator.serviceWorker.controller)
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) {
      hadController = true
      return
    }
    if (touched || reloading) return
    reloading = true
    window.location.reload()
  })

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        let hiddenAt = 0
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
            hiddenAt = Date.now()
            return
          }
          // Back after hours (the app stayed open overnight): whatever was
          // typed then is stale, a fresh version matters more. A short
          // switch to another app keeps the form untouched.
          if (hiddenAt && Date.now() - hiddenAt > LONG_AWAY_MS) touched = false
          registration.update().catch(() => {})
        })
      })
      .catch((err) => console.error('Service worker registration failed:', err))
  })
}
