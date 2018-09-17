/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */

  static get DATABASE_URL() {
    let port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get RESTAURANT_BY_ID(){
    let port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants?id=`;
  }

  static get REVIEW_FOR_RESTAURANT_URL(){
    let port = 1337; // Change this to your server port
    return `http://localhost:${port}/reviews/?restaurant_id=`;
  }

  static get REVIEW_URL(){
    let port = 1337; // Change this to your server port
    return `http://localhost:${port}/reviews/`;
  }

    static get FAVORITE_URL(){
      let port = 1337; // Change this to your server port
      return `http://localhost:${port}/restaurants/`;
    }


static fetchUpdateFavorite(id,isFav)
{ let url = DBHelper.FAVORITE_URL+id+'/?is_favorite='+isFav;
  console.log(id,isFav,url);
  return fetch(url,{method:'PUT'})
  .then(response =>{
    if(response.ok)
    {
      let result = response.json();
      return result;
    }
  }).then(result => result)
  .catch(err => console.log(err));
}


  /**
   * Fetch all restaurants.
   */
   static fetchRestaurants(){
    return fetch(DBHelper.DATABASE_URL).then(response => {
      if(response.ok)
      {
        let res = response.json();
        return res;
      }
    }).then(respArr => {
      respArr.forEach(res => {
        if(res.name=='Casa Enrique'){
          res.photograph = 10;
      }
    });
        return respArr;
    }).catch((err) => console.log(err));
   }
    /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
  // fetch all restaurants with proper error handling.
    return fetch(DBHelper.RESTAURANT_BY_ID+id).then(response => {
        if(response.ok)
        {
          const restaurant = response.json();
          return (restaurant);
        }
      }).then(restaurant => restaurant)
      .catch(err => { // Restaurant does not exist in the database
          console.log('Restaurant does not exist', err);
      });
  }


  // Fetch all reviews
  static fetchReviews(restaurantId){
    return fetch(DBHelper.REVIEW_FOR_RESTAURANT_URL+restaurantId).then(response => {
      if(response.ok){
        const reviews = response.json();
        return reviews;
      }
    }).then(reviews => reviews)
    .catch((err) => {
      console.log('Reviews does not exist');
    });
  }

static fetchPostReview(data){
  return fetch('http://localhost:1337/reviews/',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body: JSON.stringify(data)
  }).then(response => {
    var result = response.json();
    return result;
  }).then(result => result)
  .catch(err => console.log(err));
}


  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine) {
    // Fetch all restaurants  with proper error handling
    return DBHelper.fetchRestaurants().then((restaurants) => {
      // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
       return (results);
      });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then((restaurants) => {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        if(results)
        {
          return results;
        }
      }).catch(err => {
        console.log("err..",err);
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then((restaurants) => {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        return (results);
    }).catch(err => console.log("err..",err));
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    // Fetch all restaurants
   return DBHelper.fetchRestaurants().then(restaurants => {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        return uniqueNeighborhoods;
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines() {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then((restaurants) => {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        if(uniqueCuisines) return uniqueCuisines;
    }).catch(err => console.log(err));
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/images/${restaurant.photograph}`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}
