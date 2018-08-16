var restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchRestaurantFromURL();
});


/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = () => {
  // if (self.restaurant) { // restaurant already fetched!
  //   return (self.restaurant);
  // }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    console.log(error);
  } else {
    DBHelper.fetchRestaurantById(id)
      .then(restaurant =>{
        self.restaurant = restaurant;
        //console.log(self.restaurant);
        initMap();
        fillRestaurantHTML();
      //callback(null, restaurant)
    }).catch((err)=>console.log(err));
  }
}
/**
 * Initialize leaflet map
 */
initMap = () => {
  //fetchRestaurantFromURL((restaurant) => {
  let lat = self.restaurant.latlng.lat;
  let lng = self.restaurant.latlng.lng;
      self.newMap = L.map('map', {
        center: [lat,lng],
        zoom: 16,
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
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
//  });
}

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */


/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const imageDiv = document.getElementById('restaurant-img');

  //image.src = DBHelper.imageUrlForRestaurant(restaurant);
  let imgName = restaurant.photograph;
  //let imgName = DBHelper.imageUrlForRestaurant(restaurant);
  //imgName = imgName.substring(imgName.lastIndexOf('\/')+1,imgName.indexOf('.'));

  const picture = document.createElement('picture');

  let source1 = document.createElement('source');
  source1.media="(max-width:320px)";
  source1.srcset=`images/${imgName}-280.jpg`;
  picture.append(source1);

  let source2 = document.createElement('source');
  source2.media="(min-width:320px) and (max-width:550px)";
  source2.srcset=`images/${imgName}-380.jpg`;
  picture.append(source2);

  let source3 = document.createElement('source');
  source3.media="(min-width:551px) and (max-width:900px)";
  source3.srcset=`images/${imgName}-500.jpg`;
  picture.append(source3);

  let source4 = document.createElement('source');
  source4.media="(min-width:901px)";
  source4.srcset=`images/${imgName}-680.jpg`;
  picture.append(source4);

  let image = document.createElement('img');
  image.className = 'restaurant-img'
  image.src = `images/${imgName}.jpg`;
  image.alt = restaurant.name + " - Restaurant" + "@ " +restaurant.address;
  picture.append(image)

  imageDiv.append(picture);


  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
