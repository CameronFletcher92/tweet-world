/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var mongoose = require('mongoose');
var config = require('./config/environment');

// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);

// Populate DB with sample data
if(config.seedDB) { require('./config/seed'); }

// Setup server
var app = express();
var server = require('http').createServer(app);
var socketio = require('socket.io')(server, {
  serveClient: (config.env === 'production') ? false : true,
  path: '/socket.io-client'
});
require('./config/socketio')(socketio);
require('./config/express')(app);
require('./routes')(app);

// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;


// Twitter stuff
var Twit = require('twit');
var searches = {};

var T = new Twit({
  consumer_key:         'iOz8PaIppbytlYo8VuNgaYLkY',
  consumer_secret:      'B2a4OfTVgRqtipNy3I8EiMvkC2UuVjt3JQdkWPIsbbEaYb6gRG',
  access_token:         '3060943338-vP7jnQP87rMnLsO6mLQhrN92KGCVcaP0geHGQtw',
  access_token_secret:  'KgDPamWRmLlF8mAemSqvsO2fzL3gCpoh24a87O4RGaAUH'
});

// Sockets
socketio.on('connection', function(socket) {

  socket.on('q', function(q) {
    // stop the old stream if it exists
    if (searches[socket.id]) {
      searches[socket.id].stop();
      delete searches[socket.id];
    }

    console.log('New Search >>', q);
    var stream = T.stream('statuses/filter', {
      track: q
    });

    stream.on('tweet', function(tweet) {
      socket.emit('tweet', tweet);
    });

    stream.on('limit', function(limitMessage) {
      console.log('Limit for User : ' + socket.id + ' on query ' + q + ' has reached!');
    });

    stream.on('warning', function(warning) {
      console.log('warning', warning);
    });

    stream.on('reconnect', function(request, response, connectInterval) {
      console.log('stream reconnecting in ' + connectInterval + ' (' + response.statusCode + ')');
    });

    stream.on('disconnect', function(disconnectMessage) {
      console.log('disconnect', disconnectMessage);
    });

    searches[socket.id] = stream;

  });

  socket.on('disconnect', function() {
    // stop the old stream if it exists
    if (searches[socket.id]) {
      searches[socket.id].stop();
      delete searches[socket.id];
    }
  });

});
