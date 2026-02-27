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
      const hadRegistrations = regs.length > 0;
      await Promise.all(regs.map((r) => r.unregister()));

      let deletedCacheCount = 0;
      if (window.caches?.keys) {
        const keys = await caches.keys();
        const stale = keys.filter((k) => k.startsWith('versed-up-'));
        deletedCacheCount = stale.length;
        await Promise.all(stale.map((k) => caches.delete(k)));
      }

      console.info('[VersedUP] Cleared stale SW/caches for fresh client load.');

      const reloadKey = 'versedup_sw_cleanup_reloaded';
      const needsReload = (hadRegistrations || deletedCacheCount > 0) && !sessionStorage.getItem(reloadKey);
      if (needsReload) {
        sessionStorage.setItem(reloadKey, '1');
        window.location.reload();
      }
    } catch (err) {
      console.warn('[VersedUP] SW cleanup failed:', err);
    }
  });
}
