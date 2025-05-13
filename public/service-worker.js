// PromptBox Service Worker
const CACHE_NAME = 'promptbox-cache-v1';
// Dynamic version that can be updated
let APP_VERSION = '1.0.0'; // This should match your app version

// Files to cache for offline use
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/icon.png',
  // Add other static assets you want to cache
];

// Install event - cache basic files
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing service worker version:', APP_VERSION);
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Fetch the current version from package.json
        return fetch('/package.json?t=' + Date.now(), {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data && data.version) {
            APP_VERSION = data.version;
            console.log('[Service Worker] Updated APP_VERSION to:', APP_VERSION);
          }
        })
        .catch(err => {
          console.error('[Service Worker] Error fetching package.json:', err);
        });
      })
      .catch((error) => {
        console.error('[Service Worker] Cache install error:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating new service worker version:', APP_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      // Notify all clients about the update
      return self.clients.matchAll({type: 'window'})
        .then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'UPDATE_AVAILABLE',
              version: APP_VERSION
            });
            console.log('[Service Worker] Notified client about update');
          });
        });
    })
  );
  
  // Immediately claim clients to take control
  return self.clients.claim();
});

// Fetch event - network-first strategy with fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and browser extensions
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension://') || 
      event.request.url.includes('extension/')) {
    return;
  }
  
  // Special handling for package.json to always get fresh version
  if (event.request.url.includes('package.json')) {
    event.respondWith(
      fetch(event.request.url + '?t=' + Date.now(), {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    );
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Don't cache responses with errors
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response as it can only be consumed once
        const responseToCache = response.clone();
        
        // Update the cache with new response
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          })
          .catch((error) => {
            console.error('[Service Worker] Error updating cache:', error);
          });
        
        return response;
      })
      .catch(() => {
        // Fallback to cache if network request fails
        return caches.match(event.request);
      })
  );
});

// Listen for messages from clients (like skip waiting)
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Skip waiting and activate immediately');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    console.log('[Service Worker] Checking for update');
    
    // Fetch the current version from package.json and compare
    fetch('/package.json?t=' + Date.now(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data && data.version && data.version !== APP_VERSION) {
        console.log('[Service Worker] New version found:', data.version, 'Current:', APP_VERSION);
        // Notify the client about the update
        event.source.postMessage({
          type: 'UPDATE_AVAILABLE',
          version: data.version
        });
      } else {
        event.source.postMessage({
          type: 'NO_UPDATE',
          version: APP_VERSION
        });
      }
    })
    .catch(err => {
      console.error('[Service Worker] Error checking for update:', err);
      event.source.postMessage({
        type: 'UPDATE_ERROR',
        error: err.message
      });
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[Service Worker] Clearing cache by request');
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('[Service Worker] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      event.source.postMessage({
        type: 'CACHE_CLEARED'
      });
    });
  }
});

// Handle periodic background sync for PWA auto updates (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-check') {
    console.log('[Service Worker] Performing periodic sync to check for updates');
    event.waitUntil(checkForUpdates());
  }
});

// Function to check for updates
async function checkForUpdates() {
  try {
    const response = await fetch('/package.json?t=' + Date.now(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.version && data.version !== APP_VERSION) {
        console.log('[Service Worker] Update found in background check');
        APP_VERSION = data.version;
        
        // Notify all clients about the update
        const clients = await self.clients.matchAll({type: 'window'});
        clients.forEach(client => {
          client.postMessage({
            type: 'UPDATE_AVAILABLE',
            version: APP_VERSION
          });
        });
        
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('[Service Worker] Background update check failed:', error);
    return false;
  }
}