self.importScripts('js/idb.js');

var CACHE_NAME = 'my-site-cache-v1';
var urlsToCache = [
  '/',
  'index.html',
  'restaurant.html',
  'css/styles.css',
  'css/rwd.css',
  'js/idb.js',
  'js/dbhelper.js',
  'js/register.js',
  'js/restaurant_info.js',
  'js/main.js'
];
var CACHE_VERSION = 1;

var DB_VERSION = 1;
var STOP_RETRYING_AFTER = 86400000; // One day, in milliseconds.
var DB_NAME='restaurantsDB';
var DB_STORE = 'restaurantStore';

let _db;
const dbPromise = () => {
  if (_db) {
    return Promise.resolve(_db);
  }

  // Assume we're using some Promise-friendly IndexedDB wrapper.
  // E.g., https://www.npmjs.com/package/idb
  return idb.open(DB_NAME, DB_VERSION, upgradeDB => {
    return upgradeDB.createObjectStore(DB_STORE,{keyPath:'id'}).put({'id':0,'World!':'hello'});
  }).then(db => {
    _db = db;
    return db;
  });
};

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if(cacheName!==CACHE_NAME)
          return caches.delete(cacheName);
        }),
        dbPromise()
      );
    })
  );
});


self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        if(event.request.url.indexOf('/restaurants?id=')>=0)
        {
            if(navigator.onLine){
              return fetch(event.request).then((response) => {
                if(response.ok){
                  var content = response.json();
                  return content;
                }
              }).then(content =>{
                var tx = _db.transaction(DB_STORE,'readwrite');
                var keyValStore = tx.objectStore(DB_STORE);
                keyValStore.put(content);
                tx.complete;
                return content;
              } )
              .then(data => new Response(JSON.stringify(data)))
              .catch(function(err){throw err;})
          }
          else{
              let reqUrl = event.request.url;
              let id= parseInt(reqUrl.substring(reqUrl.indexOf('=')+1));
              var tx1 = _db.transaction(DB_STORE,'readwrite');
              var keyValStore = tx1.objectStore(DB_STORE);
              var restaurantRec = keyValStore.get(id);
              restaurantRec.onsuccess = e => {
                var result = e.target.result;
                return result;
              };

              return restaurantRec.then(res => new Response(JSON.stringify(res)))
              .catch(e => new Response('error fetching from indexedDB',e));
            }
      }
        else{
          return fetch(event.request)
            .then(function(res) {
              if (res.status < 400) {
                return caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request.url, res.clone());
                    return res;
                  })
              }
            }).catch(function(err){throw err;})
        }
      }).catch(function(err) { 
        console.log(err);
        return err;
      })
  );
});
