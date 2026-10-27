// Retire only the former root-scoped zljixOS worker. Game workers and saved
// progress share this origin and must never be cleared by the portal.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const rootScope = new URL('/', location.origin).href;
      const registrations = await navigator.serviceWorker.getRegistrations();
      const legacy = registrations.find(registration => registration.scope === rootScope);
      if (legacy) {
        await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
      }
    } catch {
      // The game links work even if the browser blocks service worker access.
    }
  });
}
