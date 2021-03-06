let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []
const farClass = 'favorite far fa-heart fa-2x';
const fasClass = 'favorite fas fa-heart fa-2x';
/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoicHVjaGkiLCJhIjoiY2prN2lsYTlkMTE4YjN3cDBpYXllOG1idSJ9.1aM1urr6Efqh3smiJXIEIg',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);

  updateRestaurants();
}
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */





/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap(); // added
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods().then((neighborhoods) => {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines().then((cuisines) => {
      self.cuisines = cuisines;
      fillCuisinesHTML();
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}


/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood).then((restaurants) => {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const favIcon = document.createElement('input');
  favIcon.setAttribute('type','checkbox');
  favIcon.setAttribute('name','favorite');
  favIcon.setAttribute('title','select this if '+restaurant.name+' is your favorite');
  favIcon.setAttribute('aria-label',"to mark if its your favorite");
  if(restaurant['is_favorite']==='true'){
    favIcon.setAttribute('class',fasClass);
  }else{
    favIcon.setAttribute('class',farClass);
  }

  favIcon.addEventListener('click',function(e){
    var cs = e.target.getAttribute('class');
    var restaurantId = restaurant.id;
    var isFav;
    if(cs.indexOf('fas')>=0){
        e.target.setAttribute('class','favorite fa-heart fa-2x far');
        isFav='false';
    }else {
        e.target.setAttribute('class','favorite fa-heart fa-2x fas');
        isFav='true';
    }
    DBHelper.fetchUpdateFavorite(restaurantId,isFav).then(response =>{
        //self.restaurant = response;
        //fillRestaurantHTML();
        updateRestaurants();
    }).catch(err => console.log(err));
  })
  li.append(favIcon);



  //let imgName = DBHelper.imageUrlForRestaurant(restaurant);
  //imgName = imgName.substring(imgName.lastIndexOf('\/')+1,imgName.indexOf('.'));
  let imgName = restaurant.photograph;

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = `images/${imgName}.jpg`;
  image.alt = restaurant.name +"- Restaurant @ " + restaurant.address;
  // li.append(image);

  const picture = document.createElement('picture');
  let source1 = document.createElement('source');
  source1.media='(max-width:320px)';
  source1.srcset=`images/${imgName}-280.jpg`;
  picture.append(source1);

  let source2 = document.createElement('source');
  source2.media='(min-width:320px) and (max-width:550px)';
  source2.srcset=`images/${imgName}-380.jpg`;
  picture.append(source2);

  let source3 = document.createElement('source');
  source3.media='(min-width:551px) and (max-width:900px)';
  source3.srcset=`images/${imgName}-500.jpg`;
  picture.append(source3);

  let source4 = document.createElement('source');
  source4.media="(min-width:901px)";
  source4.srcset=`images/${imgName}-680.jpg`;
  picture.append(source4);

  picture.append(image)
  li.append(picture);


  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.title = restaurant.name + 'restuarant s - View Details';
  more.role = 'button';
  more.tabindex = 0;
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on('click', onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

}
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */
