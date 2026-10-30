// Kept for pages cached before 2026-10-30, whose index.html still loads this
// file. Current pages register the worker in src/lib/swUpdate.ts.
if('serviceWorker' in navigator) {window.addEventListener('load', () => {navigator.serviceWorker.register('/sw.js', { scope: '/' })})}
