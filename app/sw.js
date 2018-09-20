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
var DB_NAME='restaurantsDB';
var DB_STORE = 'restaurantStore';
var REVIEWS_STORE ='reviewsStore';
var POST_UNRESOLVED_STORE = 'unresolved';

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
    if(!upgradeDB.objectStoreNames.contains(POST_UNRESOLVED_STORE)){
      upgradeDB.createObjectStore(POST_UNRESOLVED_STORE,{keyPath:'id',autoIncrement:true}).createIndex('postreviewIndex','restaurant_id',{unique:false,multiEntry:true});
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

self.replayPendingPosts = () =>
{
    dbPromise().then(db =>{
      let tx = db.transaction(POST_UNRESOLVED_STORE,'readonly');
      let store = tx.objectStore(POST_UNRESOLVED_STORE);
      let indx = store.index('postreviewIndex');
        store.openCursor().then(cursor => {
          if (cursor) {
          let url = 'http://localhost:1337/reviews/';
          let method = 'POST';
          let body = JSON.stringify(cursor.value);
          return fetch(url,{method:method,body:body}).then(response =>{
            if(!response.ok)
            {
              return;
            }
            return response;
          }).then(response => {
            dbPromise().then(db =>{
              let tx = db.transaction(POST_UNRESOLVED_STORE,'readwrite');
              let store = tx.objectStore(POST_UNRESOLVED_STORE);
              store.openCursor().then(cursor =>{
                cursor.delete().then(() => new Response('tried resubmitting pending requests',{status:200}));
              }).then(() => replayPendingPosts());
            });
          });
        }
        else { return new Response('attempt successfull',{status:200});}
        }).catch(error => {
          console.log("Error reading cursor");
          return;
        });
    });
}


self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        else if(event.request.url.indexOf('pending')>=0)
        {
          self.replayPendingPosts();
          return new Response('submitted pending requests..',{status:200});
        }
        else if((event.request.method==='PUT') && (event.request.url.indexOf('/restaurants/')>=0) && (event.request.url.indexOf('?is_favorite')>=0))
        {
          let req = event.request;
          if(navigator.onLine)
          {
            var params = req.url.split('/');
            var id = params[4];
            var val = params[5].substring(13);

              return fetch(req).then(response => {
                if(response.ok)
                {
                  let content = response.json();
                  return content;
                }
              }).then(content => {
                  let tx = _db.transaction(DB_STORE,"readwrite");
                  let str = tx.objectStore(DB_STORE);
                  str.delete(id);
                  str.put({id:content.id,data:content});
                  return content;
                }).then(updatedResObj => new Response(JSON.stringify(updatedResObj)))
                .catch(err =>  new Response("not connected...", {status: 404}));
                //   obj.then(resObj =>{
                //     let tx = _db.transaction(DB_STORE,"readwrite");
                //     let str = tx.objectStore(DB_STORE);
                //     str.delete(id);
                //     str.put({id:content.id,data:content});
                //   return content;
                // }).then(obj => {
                //   return new Response(JSON.stringify(obj));
                // });
        }
      }else if((event.request.method==='POST') && (event.request.url.indexOf('/reviews/')>=0))
            {
              let req = event.request;
              if(navigator.onLine){
                return fetch(req).then(response =>{
                  if(response.ok)
                  {
                    let content = response.json();
                    return content;
                  }
                }).then(content =>{
                  let tx = _db.transaction(REVIEWS_STORE,'readwrite');
                  let keyValStore = tx.objectStore(REVIEWS_STORE);
                  keyValStore.put(content);
                  //tx.complete;
                  return content;
                }).then(data => new Response(JSON.stringify(data)));
              }else{
              return req.json().then(reqbody => {
                    let tx = _db.transaction(POST_UNRESOLVED_STORE,'readwrite');
                    let keyValStore = tx.objectStore(POST_UNRESOLVED_STORE);
                    keyValStore.put(reqbody);
                    //tx.complete;
                    return reqbody;
                  }).then(req => new Response(JSON.stringify(req),{status:202}));
              }
        }
       else if(event.request.url.indexOf('/restaurants')>=0)
        {
          let reqUrl = event.request.url;
          let id = reqUrl.indexOf('?id=')>=0 ? parseInt(reqUrl.substring(reqUrl.indexOf('=')+1)):-1;

            if(navigator.onLine){
              return fetch(event.request).then((response) => {
                if(response.ok){
                  var content = response.json();
                  return content;
                }
              }).then(content =>{
                let tx = _db.transaction(DB_STORE,'readwrite');
                let keyValStore = tx.objectStore(DB_STORE);
                keyValStore.put({id:id,data:content});
                tx.complete;
                return content;
              } )
              .then(data => new Response(JSON.stringify(data)))
              .catch(function(err){throw err;})
          }
          else{
              let tx1 = _db.transaction(DB_STORE,'readonly');
              let keyValStore = tx1.objectStore(DB_STORE);
              var restaurantRec = keyValStore.get(id);
              restaurantRec.onsuccess = e => {
                var result = e.target.result;
                return result;
              };
              restaurantRec.onerror = e =>{
                console.log("err...",e);
              }

              return restaurantRec.then(res => new Response(JSON.stringify(res.data)))
              .catch(e => new Response('error fetching from indexedDB',e));
            }
      }
      else if(event.request.url.indexOf('reviews/?restaurant_id=')>=0){
         let reviewsReqUrl = event.request.url;
         let fetchReview4RestId = parseInt(reviewsReqUrl.substring(reviewsReqUrl.indexOf('=')+1));
            if(navigator.onLine){
              return fetch(event.request).then(response => {
                if(response.ok){
                  let content1 = response.json();
                  return content1;
                }
              }).then(content =>{
                let tx1 = _db.transaction(REVIEWS_STORE,'readwrite');
                let keyValStore1 = tx1.objectStore(REVIEWS_STORE);
                content.forEach(review => {
                     keyValStore1.put(review);
                 });
                 //tx1.complete;
                 return content;
              }).then(content => {
                  let tx = _db.transaction(POST_UNRESOLVED_STORE,'readwrite');
                  let keyValStore = tx.objectStore(POST_UNRESOLVED_STORE);
                  let index =keyValStore.index('postreviewIndex');
                return index.count(fetchReview4RestId).then(count => {
                  if(count>0){
                    return index.getAll(fetchReview4RestId).then(newPosts => {
                      var posts = newPosts;
                    var finalReviews = content.concat(posts);
                    return finalReviews;
                    });
                  }
                  else {
                    return content;
                  }
                }).then(data => new Response(JSON.stringify(data)));
              }).catch(function(err){throw err;});
            }else{
                let tx1 = _db.transaction(REVIEWS_STORE,'readonly');
                let keyValStore1 = tx1.objectStore(REVIEWS_STORE);
                let index1 = keyValStore1.index('reviewIndex');
                return index1.getAll(fetchReview4RestId).then(items => {
                  var revs = items;
                  let tx = _db.transaction(POST_UNRESOLVED_STORE,'readwrite');
                  let keyValStore = tx.objectStore(POST_UNRESOLVED_STORE);
                  let index =keyValStore.index('postreviewIndex');
                return index.count(fetchReview4RestId).then(count =>{
                  if(count>0){
                    return index.getAll(fetchReview4RestId).then(newPosts => {
                      var posts = newPosts;
                    var finalReviews = revs.concat(posts);
                    return new Response(JSON.stringify(finalReviews));
                    });
                  }
                    return new Response(JSON.stringify(revs));
                  });
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
         return new Response("Error fetching data", {status: 500});
      })
  );
});
