// Service worker responsible for caching model files

// Name of the cache
const CACHE_NAME = 'ai-model-cache-v1';

// URLs to cache initially (can be empty if we only want to cache on demand)
const MODEL_API_PATH = '/api/models/';

// Model file extensions to cache
const MODEL_FILE_EXTENSIONS = [
  '.bin',
  '.json',
  '.onnx',
  '.safetensors',
  '.tokenizer.json',
  '.model',
  '.vocab'
];

// Setting up event listeners
self.addEventListener('install', (event: ExtendableEvent) => {
  // Skip waiting to ensure the new service worker activates immediately
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event: ExtendableEvent) => { 
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Model Cache] Clearing old cache:', cache);
            return caches.delete(cache);
          }
          return Promise.resolve();
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Helper to determine if a request is for a model file
function isModelFile(url: string): boolean {
  // Check if URL starts with our model API path
  if (url.includes(MODEL_API_PATH)) {
    // Check if the URL ends with any of our model file extensions
    return MODEL_FILE_EXTENSIONS.some(ext => url.endsWith(ext));
  }
  return false;
}

// Networking strategies
async function networkFirst(request: Request): Promise<Response> {
  try {
    // Try to get from network first
    const networkResponse = await fetch(request);
    
    // Cache the response for future use
    const cache = await caches.open(CACHE_NAME);
    // Clone the response because it's a stream that can only be consumed once
    cache.put(request, networkResponse.clone());    
    return networkResponse;
  } catch (error) {
    // If network fails, try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache either, reject with the original error
    throw error;
  }
}

async function cacheFirst(request: Request): Promise<Response> {
  // Try to get from cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, get from network
  const networkResponse = await fetch(request);
  
  // Cache the response for future use
  const cache = await caches.open(CACHE_NAME);
  // Clone the response because it's a stream that can only be consumed once
  cache.put(request, networkResponse.clone());
  
  return networkResponse;
}

// Fetch event handler
self.addEventListener('fetch', (event: FetchEvent) => {
  const request = event.request;
  
  // Check if this is a model file request
  if (isModelFile(request.url)) {    
    // Use cache-first strategy for model files
    event.respondWith(cacheFirst(request));
  }
  
  // For all other requests, use the browser's default fetch behavior
  // by not calling event.respondWith()
});

function checkCacheAvailable(): boolean {
  try {
    return 'caches' in self;
  } catch (error) {
    return false;
  }
}

self.addEventListener('message', (event: MessageEvent) => {
  if (!event.data) return;
  
  const { type, payload } = event.data;
  
  if (type === 'CACHE_MODEL_URLS') {
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        payload.urls.map((url: string) => {
          return fetch(url)
            .then(response => {
              if (response.ok) {
                cache.put(url, response);
              } else {
                console.error(`[Model Cache] Failed to pre-cache: ${url}`);
              }
            })
            .catch(error => {
              console.error(`[Model Cache] Error pre-caching ${url}:`, error);
            });
        })
      );
    });
  } else if (type === 'CLEAR_MODEL_CACHE') {
    caches.delete(CACHE_NAME);
  }
});

console.log('[Model Cache] Service Worker initialized');

const serviceWorkerSelf = self as unknown as ServiceWorkerGlobalScope;