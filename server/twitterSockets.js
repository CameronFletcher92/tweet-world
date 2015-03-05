'use strict';


module.exports = function(socketio) {
  var Twit = require('twit');
  var Tweet = require('./api/tweet/tweet.model');
  var searches = {};

  var T = new Twit({
    consumer_key:         'iOz8PaIppbytlYo8VuNgaYLkY',
    consumer_secret:      'B2a4OfTVgRqtipNy3I8EiMvkC2UuVjt3JQdkWPIsbbEaYb6gRG',
    access_token:         '3060943338-vP7jnQP87rMnLsO6mLQhrN92KGCVcaP0geHGQtw',
    access_token_secret:  'KgDPamWRmLlF8mAemSqvsO2fzL3gCpoh24a87O4RGaAUH'
  });

// Sockets
  socketio.on('connection', function(socket) {

    socket.on('query', function(q) {
      // stop the old stream if it exists
      if (searches[socket.id]) {
        console.log("stopping stream on socket: " + socket.id)
        searches[socket.id].stop();
        delete searches[socket.id];
      }

      console.log("creating stream on socket: " + socket.id + ", query: " + q);
      var stream = T.stream('statuses/filter', {
        track: q
      });

      stream.on('tweet', function(tweet) {
        // ignore tweets without location
        if (!tweet.coordinates) {
          return;
        }

        // format the tweet to match our db
        var formattedTweet = {
          userpic: tweet.user.profile_image_url,
          text: tweet.text,
          geo: tweet.coordinates.coordinates,
          date: tweet.created_at
        };

        // cache the tweet
        Tweet.create(formattedTweet);

        // emit message to clients
        socket.emit('tweet', formattedTweet);
      });


      stream.on('connected', function (response) {
        if (response.statusCode == 420) {
          console.log('socket: ' + socket.id + ' cannot connect (rate limited)');
        }
      });

      stream.on('limit', function(limitMessage) {
        console.log('tweet limit for socket: ' + socket.id + ' reached');
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
        console.log("stopping stream on socket: " + socket.id)
        searches[socket.id].stop();
        delete searches[socket.id];
      }
    });

  });
};

