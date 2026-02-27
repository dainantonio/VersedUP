import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Safety: aggressively remove stale service workers/caches to prevent old broken bundles from loading.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
      if (window.caches?.keys) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k.startsWith('versed-up-')).map((k) => caches.delete(k)));
      }
      console.info('[VersedUP] Cleared stale SW/caches for fresh client load.');
    } catch (err) {
      console.warn('[VersedUP] SW cleanup failed:', err);
    }
  });
}
