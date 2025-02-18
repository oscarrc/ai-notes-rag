import { openDB } from 'idb';

// Database name and version
const DB_NAME = 'models-db';
const DB_VERSION = 1;
const STORE_NAME = 'models';

// Cache name for storing model files
const CACHE_NAME = 'models-cache';

// Open IndexedDB for persistent storage
async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

// Save model file to IndexedDB
async function saveModelFile(url: string, data: ArrayBuffer): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.put(data, url);
  await tx.done;
}

// Get model file from IndexedDB
async function getModelFile(url: string): Promise<ArrayBuffer | undefined> {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  return await tx.store.get(url);
}

// Install event - Pre-cache assets if needed
self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Service Worker Installed & Cache Ready');
    })
  );
});

// Fetch event - Intercept model requests and cache them
self.addEventListener('fetch', (event: any) => {
  const url = event.request.url;

  // Only intercept requests related to Hugging Face model files
  if (url.includes('/api/models') || url.includes('/transformers/')) {
    event.respondWith(
      caches.match(event.request).then(async (cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] Serving model file from Cache:', url);
          return cachedResponse;
        }

        // Check if model is available in IndexedDB
        const indexedDBResponse = await getModelFile(url);
        if (indexedDBResponse) {
          console.log('[SW] Serving model file from IndexedDB:', url);
          return new Response(indexedDBResponse);
        }

        // Fetch model from network if not cached
        return fetch(event.request).then((networkResponse) => {
          const responseClone = networkResponse.clone();

          // Open the cache and store the response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
            console.log('[SW] Model file cached in Cache:', url);
          });

          // Store model in IndexedDB for future use
          networkResponse
            .clone()
            .arrayBuffer()
            .then((arrayBuffer) => {
              saveModelFile(url, arrayBuffer);
              console.log('[SW] Model file cached in IndexedDB:', url);
            });

          return networkResponse; // Serve the network response
        });
      })
    );
  }
});

self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  console.log('[SW] Service Worker Activated');
});
