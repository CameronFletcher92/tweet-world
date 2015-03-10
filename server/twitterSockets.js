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

  function formatTweet(searchText, tweet) {
    var fTweet =  {
      searchText: searchText.toLowerCase(),
      userpic: tweet.user.profile_image_url,
      text: tweet.text,
      date: tweet.created_at
    };

    // get the tweet co-ordinates
    if (tweet.coordinates) {
      // directly
      fTweet.coordinates = tweet.coordinates.coordinates;
    } else if (tweet.place) {
      // or from place's bounding box (center)
      var box = tweet.place.bounding_box.coordinates[0];
      var lng = (box[0][0] + box[1][0]) / 2;
      var lat = (box[0][1] + box[3][1]) / 2;
      fTweet.coordinates = [lng, lat];
    } else {
      // or null it
      fTweet.coordinates = null;
    }

    return fTweet;
  }


// Sockets
  socketio.on('connection', function(socket) {
    socket.on('stopTweetStream', function(searchText) {
      if (searches[socket.id]) {
        console.log("stopping stream on socket: " + socket.id);
        searches[socket.id].stream.stop();
        delete searches[socket.id];
      }
    });

    socket.on('startTweetStream', function(searchText) {
      // convert searchText to lowercase
      searchText = searchText.toLowerCase();

      // stop the old stream if it exists
      if (searches[socket.id]) {
        console.log("stopping stream on socket: " + socket.id);
        searches[socket.id].stream.stop();
        delete searches[socket.id];
      }

      // now set up the live stream
      console.log("creating stream on socket: " + socket.id + ", searchText: " + searchText);
      var stream = T.stream('statuses/filter', {
        track: searchText
      });

      // store the running stream for the user
      searches[socket.id] = {stream: stream, searchText: searchText};

      // set up the stream handlers
      stream.on('tweet', function(tweet) {
        // format the tweet to match our db
        var formattedTweet = formatTweet(searches[socket.id].searchText, tweet);

        // emit the tweet
        socket.emit('tweet', formattedTweet);

        // cache the tweet if it has location data
        if (formattedTweet.coordinates) {
          Tweet.create(formattedTweet);
        }
      });


      stream.on('connected', function (response) {
        if (response.statusCode === 420) {
          console.log('socket: ' + socket.id + ' cannot connect (rate limited)');
          socket.emit('limited');
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
    });

    // socket disconnect, make sure the stream is stopped
    socket.on('disconnect', function() {
      // stop the old stream if it exists
      if (searches[socket.id]) {
        console.log("stopping stream on socket: " + socket.id);
        searches[socket.id].stream.stop();
        delete searches[socket.id];
      }
    });

  });
};

