'use strict';
var TWEET_LIMIT = 1000;

angular.module('tweetWorldApp')
  .controller('MainCtrl', function ($scope, $http, socket, Tweet) {
    /*
    TWEET MINING
     */
    // scope variables
    $scope.tweets = [];
    $scope.searchText = '';
    $scope.searchDate = new Date();
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
      $scope.tweets = [];
      $scope.currentSearch = $scope.searchText;

      // tell the server to get the initial tweets
      Tweet.query( { searchText: $scope.searchText, searchDate: $scope.searchDate }).$promise
        .then(function(tweets) {
          // add to the counter
          $scope.tweetCount += tweets.length;

          // slice if there are too many (but keep the count)
          if (tweets.length > TWEET_LIMIT) {
            tweets = tweets.slice(0, TWEET_LIMIT);
          }

          // when the initial tweets have been received, append them
          $scope.tweets = tweets;

          // set up the live stream
          console.log($scope.tweetCount + ' initial tweets loaded, requesting stream for: ' + $scope.currentSearch);
          socket.emit('startTweetStream', $scope.currentSearch);
        }
      );
    };

    // when a tweet is pushed, prepend it to the tweets
    socket.on('tweet', function(tweet) {
      // discard tweets if search was cancelled
      if (!$scope.isSearching) {
        return;
      }

      // increment the counter
      $scope.tweetCount++;

      // prepend the new tweet, pop the end if the array is over size
      $scope.tweets.unshift(tweet);
      if ($scope.tweets.length > TWEET_LIMIT) {
        $scope.tweets.pop();
      }
    });

    socket.on('limited', function() {
      $scope.stopTweets();
      $scope.searchTweets();
      console.log("you just got limited fool");
    });

    /*
    MAP
     */
    /*
    $scope.map = {
      center: { latitude: 0, longitude: 0 },
      zoom: 1
    };
    */

    var dataPoints = [
      [44.651144316,-63.586260171, 0.5],
      [44.75, -63.5, 0.8] ];

    angular.extend($scope, {
      center: {
        lat: 44.8091,
        lng: -63.3636,
        zoom: 9
      },
      layers: {
        baselayers: {
          osm: {
            name: 'OpenStreetMap',
            url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            type: 'xyz'
          }
        },
        overlays: {
          heatmap: {
            name: 'Heat Map',
            type: 'heatmap',
            data: dataPoints,
            visible: true
          }
        }
      }
    });

  });
