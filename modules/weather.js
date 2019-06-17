function getForecasts(query, client, superagent) {

  return checkCachedWeather(query, client).then(weatherData => {

    // If the weather data is found, return the weatherData:
    if (weatherData.length > 0) {
      console.log('weatherData from cache', weatherData)
      return weatherData;
    
    //If weatherData is not found, get Location from API:
    } else {
      return getFromAPI(query, client, superagent);
    }
  })  
}

  
function checkCachedWeather(query, client) {
  
  // console.log('&&&&&&&& query', query);
  const SQL = `SELECT * FROM weathers WHERE location_id=${query.id}`;

  return client.query(SQL).then(result => {
    return result.rows;
  }); 
}
  
function getFromAPI(query, client, superagent) {
  console.log('############## query.latitude ', query.latitude);
  
  const URL =`https://api.darksky.net/forecast/${process.env.DARK_SKY}/${query.latitude},${query.longitude}`;

  return superagent
    .get(URL)
    .then(response => response.body.daily.data)
    .then(days => {
      return days.map(day => {
        let weather = new Weather(day);
        cacheForecasts(weather, client, query.id);
        return weather;
      });
    });
}
  
function cacheForecasts(weather, client, locationId) {
  console.log('caching weather data ', weather, locationId);

  const SQL = `INSERT INTO weathers (forecast, time, location_id) VALUES ('${weather.forecast}', '${weather.time}', ${locationId});`;
  return client.query(SQL).then(results => weather);
}
  
function Weather(dayData) {
  this.forecast = dayData.summary;
  this.time = new Date(dayData.time * 1000).toDateString();
}
  
module.exports = getForecasts;
