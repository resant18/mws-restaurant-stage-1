const IDB_NAME = 'mwsrestaurants';
const IDB_VERSION = 1;

class Restaurant {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.neighborhood = data.neighborhood;
    this.photograph = data.photograph;
    this.address = data.address;
    this.latlng = data.latlng;    
    this.cuisine_type = data.cuisine_type;
    this.operating_hours = data.operating_hours;
    this.reviews = data.reviews;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

/****************************************************************************************************************************
 * Common database helper functions.
 ***************************************************************************************************************************/
class IDBHelper {
  /**
   * @description Function getter to set Database URL property. Change this to restaurants.json file location on your server.
   * @return URL value as string.
   */
  static get DATABASE_URL() { 
    //const port = 8000 // Change this to your server port
    const domain = window.location.href;    

    if (!window.location.origin) {
      window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
    };
    //console.log(window.location.origin);
    //return `${window.location.origin}/data/restaurants.json`;    
    return `http://localhost:1337/restaurants`; 
  };

  /**
   * Create IndexDB database in client browser. Return Promise
   */
  static get idb() {
    // If the browser doesn't support service worker or IndexedDB,
    // we don't care about having a database
    
    if ((!navigator.serviceWorker) || (!'indexedDB' in window)) {
      console.log('This browser doesn\'t support IndexedDB');
      return Promise.reject();
    };    
    
    return idb.open(IDB_NAME, IDB_VERSION, (upgradeDb) => {
      if (!upgradeDb.objectStoreNames.contains('restaurants')) {
        var dbRestaurants = upgradeDb.createObjectStore('restaurants', {keyPath: 'id'});
        dbRestaurants.createIndex('by-id', 'id');      
      };
      /*
      if (!upgradeDb.objectStoreNames.contains('reviews')) {
        var dbReviews = upgradeDb.createObjectStore('reviews', {keyPath: 'id'});
      } */     
    });
  };
  
  /**
   * Fetch data from database
   */
  static getData(dbStore, dbIndex, check) {
    return IDBHelper.idb.then( (db) => {    
      const tx = db.transaction(dbStore);
      const store = tx.objectStore(dbStore);
      
      if ( !check ) { console.log('check=' + check); return store.getAll(); }

      const index = store.index(dbIndex);
      return index.getAll(check);
    });
  };
  
  /**
   * Add data to database
   */
  static addData(dbStore, data) {
    return IDBHelper.idb.then( (db) => {      
      const tx = db.transaction(dbStore, 'readwrite');
      const store = tx.objectStore(dbStore);   
      store.put(data);
      return tx.complete;
    })
  };

  /**
   * Search data in database
   */
  /*
  static searchData = (dbStore, dbIndex, searchKey, searchValue) => {
    let results = [];
    return IDBHelper.idb.then( (db) => {
      const tx = db.transaction(dbStore, 'readwrite');
      const store = tx.objectStore(dbStore);

      if ( !dbIndex ) { return store.openCursor(); }
      const index = store.index(dbIndex);
      return index.openCursor(); // return data sorted by index.
    })
    .then(findItem = (cursor) => {
      if (!cursor) return;
      if ( cursor.value[searchKey] == searchValue ) {
          results.push(cursor.value);
      }
      return cursor.continue().then(findItem);
    })
    .then(() => { return results; })
  };
  */


/**************************************************************************************************************************
   * Functions for Restaurants 
 *************************************************************************************************************************/


  
  /**
   * Add Restaurant data to database.
   * Check if the data was stored before, if not then add data to database. 
   */
  static addToDatabase(restaurant) {    
    return new Promise((resolve, reject) => {      
      IDBHelper.getData('restaurants', 'by-id', restaurant.id)
        .then((restaurants) => {                      
            if ( restaurants.length === 1 ) return resolve(restaurant);
            IDBHelper.addData('restaurants', restaurant).then(() => { resolve(restaurant) });
        })
        .catch(err => {                    
          const error = (`Addding data to database failed. Returned status of ${err}`);            
          //callback(error, null);
          reject(error);
        });
    })
  }

  /**
   * Fetch Restaurant Data.
   * Check if the data was stored before, if not then add data to database. 
   * Return restaurants data
   */
  
  static fetchRestaurants() {    
    let fetchedRestaurants;
    return fetch(IDBHelper.DATABASE_URL)            //fetch from the network    
      .then( (response) => response.json())       
      .then( (restaurants) => {                     // copy to Restaurant object class 
        console.log('restaurants='+restaurants);                           
        return restaurants.map( (restaurant) => new Restaurant(restaurant));        
      })      
      .then( (restaurants) => {                      // save Restaurant objects class to database                       
        fetchedRestaurants = restaurants;       
        console.log('Fetched restaurants='+fetchedRestaurants);
        let sequence = Promise.resolve();
        /*if (saveToDatabase)*/ 
        restaurants.forEach((restaurant) => sequence = sequence.then(() => IDBHelper.addToDatabase(restaurant)) );
        console.log('Sequence='+sequence);        
        return sequence;        
      })      
      .then(() => {        
        console.log('return fetchedRestaurants= '+fetchedRestaurants);
        return fetchedRestaurants;
      })      
      .catch(err => {                    
        const error = (`Fetching restaurant data failed. Returned status of ${err}`);            
        //callback(error, null);
        return Promise.reject(error);
      }); 
  }
  

  /**
   * Fetch all restaurants.
   */
  /*
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
  */

  /**
   * Fetch a restaurant by its ID.
   */
  
  static fetchRestaurantById(id) {
    // fetch all restaurants with proper error handling. 
    console.log('fetching restaurant based on id');
    return IDBHelper.fetchRestaurants()
      .then( (restaurants) => {    
        console.log(restaurants);
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          return Promise.resolve(restaurant);
        } else {
          return Promise.reject(error);
        }
      });    
  }
  
/*
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
*/

  /**
   * This function is not used
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    console.log('fetch restauranrt by cuisine');
    IDBHelper.fetchRestaurants( (error, restaurants) => {
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
   * This function is not used
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    console.log('fetch restauranrt by neighborhood');
    IDBHelper.fetchRestaurants( (error, restaurants) => {
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
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    // Fetch all restaurants
    return IDBHelper.fetchRestaurants( (restaurants) => {   
      let results = restaurants;
      if (cuisine != 'all') { // filter by cuisine
        results = results.filter(r => r.cuisine_type == cuisine);
      }
      if (neighborhood != 'all') { // filter by neighborhood
        results = results.filter(r => r.neighborhood == neighborhood);
      }
      return Promise.resolve(results);
    })
    .catch(err => {                    
      const error = (`Fetch restaurants data by cuisine and neighborhood failed. Returned status of ${err}`);                    
      return Promise.reject(error);
    }); 
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    //console.log(IDBHelper.fetchRestaurants);
    // Fetch all restaurants
    return IDBHelper.fetchRestaurants()
      .then( (restaurants) => {      
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        return Promise.resolve(uniqueNeighborhoods);  
      })    
      .catch(err => {                    
        const error = (`Fetching neighborhoods data failed. Returned status of ${err}`);                    
        return Promise.reject(error);
      }); 

      /*
      * Need to learn if this code below returns different results than the code at the top.
      return IDBHelper.fetchRestaurants( (restaurants) => {
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        return Promise.resolve(uniqueNeighborhoods);  
      })
      .catch(err => {                    
        const error = (`Fetching neighborhoods data failed. Returned status of ${err}`);                    
        return Promise.reject(error);
      });
      */ 
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines() {
    // Fetch all restaurants
    return IDBHelper.fetchRestaurants()
      .then ( (restaurants) => {        
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        return Promise.resolve(uniqueCuisines);        
      })
      .catch(err => {                    
        const error = (`Fetching cuisine data failed. Returned status of ${err}`);                    
        return Promise.reject(error);
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


}; // End of Database helper class
  

