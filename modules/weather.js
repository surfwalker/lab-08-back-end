function getForecasts(latitude, longitude, locationId, client, superagent) {

  let forecasts = getFromCache(client, locationId);
  
  if (forecasts.length === 0) {
    forecasts = getFromAPI(latitude, longitude, locationId, client, superagent);
  } else {
    return forecasts;
  }
}
  
function getFromCache(client, locationId) {
  
  return client
    .get('SELECT * FROM weathers WHERE location_id=' + locationId)
    .then(result => result.rows);
  
}
  
function getFromAPI(latitude, longitude, locationId, client, superagent) {
  
  const URL =`https://api.darksky.net/forecast/${process.env.DARK_SKY}/${latitude},${longitude}`;

  return superagent
    .get(URL)
    .then(response => response.body.daily.data)
    .then(days => days.map(day => new Weather(day)))
    .then(dayInstances => cacheForecasts(dayInstances, locationId, client))
  
}

// old code:

// return superagent
//   .get(URL)
//   .then(res => {
//     console.log('res.body', res.body);
//     let daySummaries = res.body.daily.data.map(data => new Weather(data));
//     response.send(daySummaries);
//   })

  
function cacheForecasts(dayInstances, locationId, client) {
  
  dayInstances.forEach(day => {
  
    const SQL = `
        INSERT INTO weathers (forecast, time, location_id) 
        VALUES (${day.foreacast}, ${day.time}, ${locationId});`;
  
    client.query(SQL);
  });
}
  
function Weather(dayData) {
  this.forecast = dayData.summary;
  this.time = new Date(dayData.time * 1000).toDateString();
}
  
module.exports = getForecasts;
  