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
const app = express();
const PORT = process.env.PORT;
app.use(cors());

// internal modules
const getLocation = require('./modules/location');
const getForecasts = require('./modules/weather');

// routes
app.get('/location', handleLocation);
app.get('/weather', handleWeather);
app.get('/events', handleEventsRequest);
// app.get('/db', dbTest);

// DB TEST:

// function dbTest(request, response){
//   // response.send('Hello')
//   client.query('SELECT * FROM locations')
//     .then(results => response.send(results.rows))
//     .catch(err => {
//       console.error(err)
//       response.status(500).send(err)
//     })
// }


// route handlers
function handleLocation(req, res) {
  getLocation(req.query.data, client, superagent)
    .then(location => res.send(location))
    .catch(error => handleError(error, res));
}

function handleWeather(req, res) {

  console.log('************* the query from location ', req.query.data);

  getForecasts(req.query.data, client, superagent)
    .then(forecasts => res.send(forecasts))
    .catch(error => handleError(error, res));
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

app.listen(PORT, () => console.log(`App is listening on ${PORT}`) );
