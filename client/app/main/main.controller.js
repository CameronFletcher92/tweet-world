'use strict';
var TWEET_FEED_LIMIT = 10;

angular.module('tweetWorldApp')
  .controller('MainCtrl', function ($scope, $http, socket, Tweet, $mdDialog) {
    /*
    TWEET MINING
     */
    // scope variables
    $scope.tweetFeed = [];
    $scope.heatPoints = [];
    $scope.searchText = 'happy';

    var now = new Date();
    $scope.searchDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  0, 0, 0);

    $scope.currentSearch = '';
    $scope.isSearching = false;
    $scope.tweetCount = 0;

    $scope.stopTweets = function() {
      if ($scope.currentSearch === '') {
        return;
      }

      console.log('stopping stream');
      socket.emit('stopTweetStream', $scope.currentSearch);
      $scope.isSearching = false;
    };

    $scope.searchTweets = function() {
      if ($scope.searchText === '') {
        return;
      }

      $scope.searchText = $scope.searchText.toLowerCase();
      $scope.isSearching = true;

      // if the search hasn't changed, just restart the stream
      if ($scope.currentSearch === $scope.searchText) {
        console.log('resuming search for: ' + $scope.searchText);
        socket.emit('startTweetStream', $scope.currentSearch);
        return;
      }

      // otherwise, reset values, query cache and restart stream
      console.log('creating new search for: ' + $scope.searchText);

      // set the current search text
      $scope.currentSearch = $scope.searchText;

      // reset tweet feed/count
      $scope.tweetCount = 0;
      $scope.tweetFeed.length = 0;

      // work-around to force heatmap refresh
      $scope.heatPoints.length = 0;
      $scope.heatPoints.push([0,0,0]);

      // get the initial tweets
      Tweet.query( { searchText: $scope.searchText, searchDate: $scope.searchDate }).$promise
        .then(function(tweets) {
          // complete the heatmap reset
          $scope.heatPoints.length = 0;

          // add to the counter
          $scope.tweetCount += tweets.length;

          console.log($scope.tweetCount + ' initial tweets loaded');

          // add the initial tweets to the heatmap
          for (var i = 0; i < tweets.length; i++) {
            if (tweets[i].coordinates) {
              $scope.heatPoints.push(generateHeatPoint(tweets[i]));
            }
          }

          // slice if there are too many for the feed
          var freeSpace = TWEET_FEED_LIMIT - $scope.tweetFeed.length;
          if (tweets.length > freeSpace) {
            tweets = tweets.slice(0, freeSpace);
          }

          console.log("attaching " + tweets.length + " initial tweets to feed");

          // update the feed
          for (var j = 0; j < tweets.length; j++) {
            $scope.tweetFeed.unshift(tweets[j]);
          }
        }
      );

      // set up the live stream
      console.log('requesting stream for: ' + $scope.currentSearch);
      socket.emit('startTweetStream', $scope.currentSearch);
    };


    // flip the order of the co-ords (map doesn't use geojson)
    function generateHeatPoint(tweet) {
      return [tweet.coordinates[1], tweet.coordinates[0], 0.2];
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


    // rate limited by twitter, show the alert
    socket.on('limited', function() {
      $scope.stopTweets();

      $mdDialog.show(
        $mdDialog.alert()
          .title('Rate limited by Twitter')
          .content('Changing the keyword too often results in a rate-limit, just chill out for a bit')
          .ariaLabel('Password notification')
          .ok('Got it!')
      );
    });

    /*
    MAP
     */
    $scope.map = {
      defaults: {
        maxZoom: 8,
        minZoom: 2
      },
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
            visible: true
          }
        }
      }
    };
  });
