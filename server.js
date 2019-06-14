'use strict';

// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

// database set up
const client = new pg.Client(process.env.DATABASE_URL)
client.connect();
client.on('err', err => console.error(err));


// Application Setup
const PORT = process.env.PORT;
const app = express();
app.use(cors());

// API Routes
app.get('/location', handleLocationRequest);
app.get('/weather', handleWeatherRequest);
app.get('/events', handleEventsRequest);
// app.get('/db', dbTest);

// function dbTest(request, response){
//   // response.send('Hello')
//   client.query('SELECT * FROM locations')
//     .then(results => response.send(results.rows))
//     .catch(err => {
//       console.error(err)
//       response.status(500).send(err)
//     })
// }


app.listen(PORT, () => console.log(`App is listening on ${PORT}`) );


function handleLocationRequest(request, response){

  // TODO: first check if location has already been searched
  // TODO: we need to cache aka put location data in database
  // TODO: if location is in DB => return "cached" version:
  // SELECT * FROM locations WHERE search_query = the query passed
  // TODO: if the location data is not in the DB, do below, aka get it from the API
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
  const searchData = request.query.data;
  console.log('searchData', searchData);
  // TODO add lng
  const URL =`https://api.darksky.net/forecast/${process.env.DARK_SKY}/${searchData.latitude},${searchData.longitude}`;
  console.log(URL)
  return superagent.get(URL)
    .then(res => {
      console.log('res.body', res.body);
      let daySummaries = res.body.daily.data.map(data => new Weather(data));
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
  this.time = new Date(dayData.time * 1000).toDateString();
}

function handleError(error, response) {
  console.error(error);
  response.status(500).send('I\'m sorry! we have run into a problem. Please try again later.');
}

// EventBrite API

function handleEventsRequest(req, res){
  getEvents(req.query)
    .then(data => res.send(data))
    .catch(error => handleError(error) )
}

function getEvents(query){
  console.log('query', query);
  let URL = `https://www.eventbriteapi.com/v3/events/search?location.address=${query.data.formatted_query}&location.within=1km`
  return superagent.get(URL)
    .set('Authorization', `Bearer ${process.env.EVENT_BRITE}`)
    .then(data => data.body.events.map(event => new Event(event)) )
    .catch(error => handleError(error));
}

function Event(event){
  this.link = event.url,
  this.name= event.name.text,
  this.event_date = event.start.local,
  this.summary = event.summary
}
