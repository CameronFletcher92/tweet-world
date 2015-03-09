'use strict';
var TWEET_FEED_LIMIT = 10;

angular.module('tweetWorldApp')
  .controller('MainCtrl', function ($scope, $http, socket, Tweet, $mdToast) {
    /*
    TWEET MINING
     */
    // scope variables
    $scope.tweetFeed = [];
    $scope.heatPoints = [];
    $scope.searchText = '';

    var now = new Date();
    $scope.searchDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  0, 0, 0);

    $scope.currentSearch = '';
    $scope.isSearching = false;
    $scope.tweetCount = 0;

    $scope.stopTweets = function() {
      if ($scope.currentSearch == '') {
        return;
      }

      console.log('stopping stream');
      socket.emit('stopTweetStream', $scope.currentSearch);
      $scope.isSearching = false;
    };

    $scope.searchTweets = function() {
      if ($scope.searchText == '') {
        return;
      }

      $scope.searchText = $scope.searchText.toLowerCase();
      $scope.isSearching = true;

      // if the search hasn't changed, just restart the stream
      if ($scope.currentSearch == $scope.searchText) {
        console.log('resuming search for: ' + $scope.searchText);
        socket.emit('startTweetStream', $scope.currentSearch);
        return;
      }

      // otherwise, reset values, query cache and restart stream
      console.log('creating new search for: ' + $scope.searchText);
      $scope.tweetCount = 0;
      $scope.tweetFeed.length = 0;
      $scope.heatPoints.length = 0;
      $scope.currentSearch = $scope.searchText;

      // tell the server to get the initial tweets
      Tweet.query( { searchText: $scope.searchText, searchDate: $scope.searchDate }).$promise
        .then(function(tweets) {
          // add to the counter
          $scope.tweetCount += tweets.length;

          // add the initial tweets to the heatmap
          for (var i = 0; i < tweets.length; i++) {
            if (tweets[i].coordinates) {
              $scope.heatPoints.push(generateHeatPoint(tweets[i]));
            }
          }

          // slice if there are too many (but keep the count)
          if (tweets.length > TWEET_FEED_LIMIT) {
            tweets = tweets.slice(0, TWEET_FEED_LIMIT);
          }

          // add to the tweet feed
          $scope.tweetFeed = tweets;

          // set up the live stream
          console.log($scope.tweetCount + ' initial tweets loaded, requesting stream for: ' + $scope.currentSearch);
          socket.emit('startTweetStream', $scope.currentSearch);
        }
      );
    };

    function generateHeatPoint(tweet) {
      return [tweet.coordinates[1], tweet.coordinates[0], 0.5];
    }

    // when a tweet is pushed, prepend it to the tweets
    socket.on('tweet', function(tweet) {
      // discard tweets if search was cancelled
      if (!$scope.isSearching) {
        return;
      }

      // increment the counter
      $scope.tweetCount++;

      // add to the heat points
      if (tweet.coordinates) {
        $scope.heatPoints.push(generateHeatPoint(tweet));
      }

      // prepend the new tweet, pop the end if the array is over size
      $scope.tweetFeed.unshift(tweet);
      if ($scope.tweetFeed.length > TWEET_FEED_LIMIT) {
        $scope.tweetFeed.pop();
      }

    });


    socket.on('limited', function() {
      $scope.stopTweets();

      $mdToast.show(
        $mdToast.simple()
          .content('Rate Limited by Twitter (chill out for a bit)!')
          .position('top right')
          .hideDelay(3000)
      );
    });

    /*
    MAP
     */
    $scope.map = {
      center: {
        lat: 0,
        lng: 0,
        zoom: 2
      },
      layers: {
        baselayers: {
          osm: {
            name: 'OpenStreetMap',
            //url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', // beige and blue
            //url: 'http://{s}.tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png', // brown and blue
            //url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}', // real
            url: 'http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', // black and white
            type: 'xyz'
          }
        },
        overlays: {
          heatmap: {
            name: 'Heat Map',
            type: 'heatmap',
            data: $scope.heatPoints,
            size: 400, // multiplied in webgl-heatmap-leaflet
            alphaRange: 0.1,
            visible: true
          }
        }
      }
    };
  });
