const CACHE_NAME = 'wicompta-v1';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'maj_eleve.html',
  'finances.html',
  'documents.html',
  'config.html',
  'login.html',
  'logoapp.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&family=Playfair+Display:wght@700&display=swap'
];

// Installation : Mise en cache robuste
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force le SW à devenir actif immédiatement
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // On utilise map pour que si un fichier manque, l'installation continue quand même
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => {
          return cache.add(url).catch(err => console.warn(`Fichier non trouvé pour le cache : ${url}`, err));
        })
      );
    })
  );
});

// Activation : Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Prend le contrôle des pages immédiatement
  );
});

// Stratégie : Réseau en priorité, repli sur le Cache
// Très important pour WiCompta car les données Firebase ont besoin du réseau
self.addEventListener('fetch', (event) => {
  // On ne gère que les requêtes GET (évite les erreurs sur les POST de Firebase)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la réponse est valide, on peut mettre à jour le cache dynamiquement (optionnel)
        return response;
      })
      .catch(() => {
        // En cas d'échec réseau, on cherche dans le cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si rien n'est trouvé, on pourrait renvoyer une page d'erreur offline ici
        });
      })
  );
});
