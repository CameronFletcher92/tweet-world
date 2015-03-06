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

  function formatTweet(queryText, tweet) {
    var fTweet =  {
      query: queryText,
      tweetId: tweet.id,
      userpic: tweet.user.profile_image_url,
      text: tweet.text,
      date: tweet.created_at
    };

    if (tweet.coordinates) {
      fTweet.geo = tweet.coordinates.coordinates;
    } else {
      fTweet.geo = null;
    }

    return fTweet;
  }


// Sockets
  socketio.on('connection', function(socket) {
    socket.on('query', function(q, date) {
      // stop the old stream if it exists
      if (searches[socket.id]) {
        console.log("stopping stream on socket: " + socket.id);
        searches[socket.id].stream.stop();
        delete searches[socket.id];
      }

      // first, get the inital query
      var queryText = q + ' since:' + date;
      console.log(queryText);
      T.get('search/tweets', { q: queryText, count:100 }, function(err, data, response) {
        if (err) {
          console.log(err);
        } else if (data) {
          console.log(data);
        }
        var tweets = data.statuses;
        var formattedTweets = [];

        // format the tweets
        for (var i = 0; i < tweets.length; i++) {
          formattedTweets.push(formatTweet(searches[socket.id].query, tweets[i]));
        }

        // emit the initial tweets to the client
        console.log("sending " + formattedTweets.length + " initial tweets to the client");

        // now setup a stream for the client here instead of at the same time

      });


      /* not working at the moment
      var aus = [ '-37.5050', '140.999', '-28.157', '153.638824'];
      var sanFrancisco = [ '-122.75', '36.8', '-121.75', '37.8' ];
      */

      // now set up the live stream
      console.log("creating stream on socket: " + socket.id + ", query: " + q);
      var stream = T.stream('statuses/filter', {
        track: q
      });

      // store the running stream for the user
      searches[socket.id] = {stream: stream, query: q.toLowerCase()};

      // set up the stream handlers
      stream.on('tweet', function(tweet) {
        // format the tweet to match our db
        var formattedTweet = formatTweet(searches[socket.id].query, tweet);

        // cache the tweet
        //Tweet.create(formattedTweet);

        // emit message to clients
        socket.emit('tweet-live', formattedTweet);
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

