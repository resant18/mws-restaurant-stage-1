const IDB_NAME = 'mwsrestaurants';
const IDB_VERSION = 1;
/**
 * Common database helper functions.
 */
class IDBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    //const port = 8000 // Change this to your server port
    const domain = window.location.href;    

    if (!window.location.origin) {
      window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
    }
    //console.log(window.location.origin);
    //return `${window.location.origin}/data/restaurants.json`;    
    return `http://localhost:1337/restaurants`; 
  }

  /**
   * Create IndexDB database in client browser. Return Promise
   */
  static get idb() {
    // If the browser doesn't support service worker or IndexedDB,
    // we don't care about having a database
    
    if ((!navigator.serviceWorker) || (!'indexedDB' in window)) {
      console.log('This browser doesn\'t support IndexedDB');
      return Promise.resolve();
    };    
    
    return idb.open(IDB_NAME, IDB_VERSION, (upgradeDb) => {
      if (!upgradeDb.objectStoreNames.contains('restaurants')) {
        var dbRestaurants = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
        dbRestaurants.createIndex('by-id', 'id');      
      }
      /*
      if (!upgradeDb.objectStoreNames.contains('reviews')) {
        var dbReviews = upgradeDb.createObjectStore('reviews', {keyPath: 'id'});
      } */     
    });
  }

static getData() {
  return IDBHelper.idb.then(db => {
    if (!db) return;
    const tx = db.transaction('restaurants', 'readwrite');
    const store = tx.objectStore('restaurants');       
    return store.getAll();
  })
}




  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {      
    IDBHelper.idb.then(db => {
      if (!db) return;
      const tx = db.transaction('restaurants', 'readwrite');
      const store = tx.objectStore('restaurants');       
      store.getAll().then(data => {
        if (data.length === 0) {
          // if there is no data in database, fetch data from network ...
          fetch(IDBHelper.DATABASE_URL) 
          .then(response => response.json()) // returns a promise that resolves to the parsed JSON
          .then(restaurants => {
              // ...and then store in database
              console.log('store in database');  
              const tx = db.transaction('restaurants', 'readwrite');
              const store = tx.objectStore('restaurants');            
              restaurants.forEach(restaurant => {
                store.put(restaurant);
              });      
              callback(null, restaurants);
          })
          .catch(err => {            
            console.log('unable to fetch from network:');            
            const error = (`Request failed. Returned status of ${err}`);            
            callback(error, null);
          }); 
        } else {
          // found data in database
          console.log('get data from database');
          callback(null, data);
        }
      })      
    })
  }
    

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.    
    IDBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    console.log('fetch restauranrt by cuisine');
    IDBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    console.log('fetch restauranrt by neighborhood');
    IDBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    console.log('cuisine='+cuisine);
    
    IDBHelper.fetchRestaurants((error, restaurants) => {    
      console.log('fetching');  
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    IDBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    IDBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
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
    return (`/dist/img/${restaurant.photograph}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: IDBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
