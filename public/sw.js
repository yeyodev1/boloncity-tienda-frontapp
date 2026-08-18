// Kill-switch: la tienda ANTERIOR (PWA de digitalmindtec) registró un service worker
// en esta misma ruta (/sw.js, scope "/") que sigue sirviendo la app vieja desde el caché
// del visitante. Sus llamadas a la API caen ahora en el backend nuevo y fallan
// ("No hay sucursales disponibles"). Cuando el navegador revisa si /sw.js cambió (en cada
// navegación), recibe ESTE archivo: borra todos los cachés, se desregistra y recarga la
// página, dejando al cliente en la tienda nueva sin que tenga que limpiar nada a mano.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch (err) {
        // sin cachés que borrar, seguir
      }
      try {
        await self.clients.claim();
      } catch (err) {
        // seguir aunque claim falle
      }
      try {
        await self.registration.unregister();
      } catch (err) {
        // seguir aunque unregister falle
      }
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => {
        try {
          client.navigate(client.url);
        } catch (err) {
          // algunos navegadores no permiten navigate(); la recarga la hará el usuario
        }
      });
    })()
  );
});

// Sin caché propio: todo pasa directo a la red (la tienda nueva).
self.addEventListener('fetch', () => {});
