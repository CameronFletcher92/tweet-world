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

    // set geo as null if there are no coordinates
    if (tweet.coordinates) {
      //console.log(tweet.coordinates.coordinates);
      fTweet.coordinates = tweet.coordinates.coordinates;
    } else {
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

        // cache the tweet
        Tweet.create(formattedTweet);
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

