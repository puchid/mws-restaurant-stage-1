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
var REVIEWS_STORE ='reviewsStore';

let _db;
const dbPromise = () => {
  if (_db) {
    return Promise.resolve(_db);
  }

  // Assume we're using some Promise-friendly IndexedDB wrapper.
  // E.g., https://www.npmjs.com/package/idb
  return idb.open(DB_NAME, DB_VERSION, upgradeDB => {
    if(!upgradeDB.objectStoreNames.contains(DB_STORE))
    {
      upgradeDB.createObjectStore(DB_STORE,{keyPath:'id'});
    }
    if(!upgradeDB.objectStoreNames.contains(REVIEWS_STORE)){
      upgradeDB.createObjectStore(REVIEWS_STORE,{keyPath:'id'}).createIndex('reviewIndex','restaurant_id',{unique:false,multiEntry:true});
    }
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
       else if(event.request.url.indexOf('/restaurants?id=')>=0)
        {
            if(navigator.onLine){
              return fetch(event.request).then((response) => {
                if(response.ok){
                  var content = response.json();
                  return content;
                }
              }).then(content =>{
                let tx = _db.transaction(DB_STORE,'readwrite');
                let keyValStore = tx.objectStore(DB_STORE);
                // if(!keyValStore.get(content.id)===undefined)
                // {
                  keyValStore.add(content);
                //}
                tx.complete;
                return content;
              } )
              .then(data => new Response(JSON.stringify(data)))
              .catch(function(err){throw err;})
          }
          else{
              let reqUrl = event.request.url;
              let id= parseInt(reqUrl.substring(reqUrl.indexOf('=')+1));
              let tx1 = _db.transaction(DB_STORE,'readwrite');
              let keyValStore = tx1.objectStore(DB_STORE);
              var restaurantRec = keyValStore.get(id);
              restaurantRec.onsuccess = e => {
                var result = e.target.result;
                return result;
              };

              return restaurantRec.then(res => new Response(JSON.stringify(res)))
              .catch(e => new Response('error fetching from indexedDB',e));
            }
      }
      else if(event.request.url.indexOf('reviews/?restaurant_id=')>=0){
         let reviewsReqUrl = event.request.url;
         let fetchReview4RestId = parseInt(reviewsReqUrl.substring(reviewsReqUrl.indexOf('=')+1));
// console.log(fetchReview4RestId,event.request);
            if(navigator.onLine){
              return fetch(event.request).then((response) => {
                if(response.ok){
                  let content1 = response.json();
                  return content1;
                }
              }).then(content =>{
                let tx1 = _db.transaction(REVIEWS_STORE,'readwrite');
                let keyValStore1 = tx1.objectStore(REVIEWS_STORE);
                content.forEach(review => {//console.log(typeof review, review);
                  //console.log(keyValStore1.get(review.id)=='undefined');
                    // if(!keyValStore1.get(review.id)=='undefined')
                    // {
                     keyValStore1.add(review);
                   //}
                 });
                 tx1.complete;
                return content;
              } )
              .then(data => new Response(JSON.stringify(data)))
              .catch(function(err){throw err;})
            }else{
              let tx1 = _db.transaction(REVIEWS_STORE,'readonly');
              let keyValStore = tx1.objectStore(REVIEWS_STORE);
              let index = keyValStore.index('reviewIndex');
              return index.getAll().then(function(items){
                console.log('items...',typeof items, items);
                return new Response(JSON.stringify(items));
              });
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
