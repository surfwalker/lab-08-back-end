function getLocation(query, client, superagent) {
  
  return getStoredLocation(query, client)
    .then(location => {

      if(location) {
        console.log('.......from cache');
        return location;
      } else {
        console.log('.......from API');
        return getLocationFromAPI(query, client, superagent);
      }
    });
}

function getStoredLocation(query, client) {

  const sql = `SELECT * FROM locations WHERE search_query='${query}'`;

  return client
    .query(sql)
    .then(results => results.rows[0]);

}

function getLocationFromAPI(query, client, superagent) {

  const URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEO_DATA}`;
  
  return superagent
    .get(URL)
    .then(response => new Location(query, response.body.results[0]))
    .then(location => cacheLocation(location, client));
}

function cacheLocation(location, client) {

  const insertSQL = `INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES('${location.search_query}','${location.formatted_query}', ${location.latitude}, ${location.longitude});`;

  return client.query(insertSQL).then(results => location);
}

function Location(query, geoData) {
  console.log(query, geoData);
  this.search_query = query;
  this.formatted_query = geoData.formatted_address;
  this.latitude = geoData.geometry.location.lat;
  this.longitude = geoData.geometry.location.lng;
}

module.exports = getLocation;