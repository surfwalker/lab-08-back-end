'use strict';

// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

// Application Setup
const PORT = process.env.PORT;
const app = express();
app.use(cors());

// API Routes
app.get('/location', handleLocationRequest);
app.get('/weather', handleWeatherRequest);

app.listen(PORT, () => console.log(`App is listening on ${PORT}`) );


function handleLocationRequest(request, response){
  const searchData = request.query.data;
  const URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${searchData}&key=${process.env.GEO_DATA}`;

  return superagent.get(URL)
    .then(res => {
      const location = new Location(request.query.data, res.body);
      response.send(location);
    })
    .catch(error=>{
      handleError(error, response);
    })
}

function Location(query, rawData) {
  console.log(query, rawData);
  this.search_query = query;
  this.formatted_query = rawData.results[0].formatted_address;
  this.latitude = rawData.results[0].geometry.location.lat;
  this.longitude = rawData.results[0].geometry.location.lng;
}

function handleWeatherRequest(request, response) {
  const searchData = request.query;
  console.log('searchData', searchData);
  const URL =`https://api.darksky.net/forecast/${process.env.DARK_SKY}/${searchData.lat}`;
  console.log(URL)
  return superagent.get(URL)
    .then(res => {
      let daySummaries = searchData.daily.data.map(data => new Weather(data));
      response.send(daySummaries);
    })
    .catch(error=>{
      handleError(error, response);
    })
  // try {
  //   const rawData = require('.data/geo.json');

  //   response.send(daySummaries);

  // } catch (error) {
  //   handleError(error, response);
  // }
}

function Weather(dayData) {
  this.forecast = dayData.summary;
  this.time = new Date(dayData.time * 1000).toString().slice(0,15);
}

function handleError(error, response) {
  console.error(error);
  response.status(500).send('I\'m sorry! we have run into a problem. Please try again later.');
}
