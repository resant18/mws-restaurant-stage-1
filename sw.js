// test1
let staticCacheName = 'mws-static-v1';
let contentImgsCache = 'mws-content-imgs';
let allCaches = [
  staticCacheName,
  contentImgsCache
];

let staticFilesName = [
  'index.html',
  'restaurant.html',
  'css/styles.css',
  'js/idb.js', 
  //'js/idbhelper.js',
  'js/main.js',
  'js/restaurant_info.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css' 
]

self.addEventListener('install', function(event) {  
  console.log('Install service worker and cache static assets');
  event.waitUntil(
    caches.open(staticCacheName)
    .then(function(cache) {
      console.log('Caching sucess'); //test
      return cache.addAll(staticFilesName);
    })
  );
});

self.addEventListener('activate', function(event) {
  console.log('Activating new service worker...');
  //TODO: create database in this event based on article: https://developers.google.com/web/ilt/pwa/live-data-in-the-service-worker#storing_data_with_indexeddb
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        // only get the caches that start with mws and delete other caches.
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('mws-') &&
                 !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  //console.log(`Fetching ${event.request.url}`);
  event.respondWith(
    caches.open(allCaches).then(function(cache) {
      return cache.match(event.request).then(function (response) {
        return response || fetch(event.request).then(function(response) {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
  );
});

// this function will be called by statement worker.postMessage({action: 'skipWaiting'}); from the active page
self.addEventListener('message', function(event) {
  console.log('Perform skip waiting');
  if (event.data.action === 'skipWaiting') {
    console.log('skip waiting....');
    self.skipWaiting();
  }
});