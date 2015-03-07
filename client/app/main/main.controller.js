'use strict';
var TWEET_LIMIT = 20;

angular.module('tweetWorldApp')
  .controller('MainCtrl', function ($scope, $http, socket, Tweet) {
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

      $scope.isSearching = true;

      // if the search hasn't changed, just restart the stream
      if ($scope.currentSearch == $scope.searchText) {
        console.log('resuming search for: ' + $scope.searchText);
        socket.emit('startTweetStream', $scope.currentSearch);
        return;
      }

      // otherwise, reset values, query cache and restart stream
      else {
        console.log('creating new search for: ' + $scope.searchText);
        $scope.tweetCount = 0;
        $scope.tweets = [];
        $scope.currentSearch = $scope.searchText;

        // tell the server to get the initial tweets
        var tweets = Tweet.query(function () {
          // add to the counter
          $scope.tweetCount += tweets.length;

          // slice if there are too many (but keep the count)
          if (tweets.length > TWEET_LIMIT) {
            tweets = tweets.slice(0, TWEET_LIMIT);
          }

          // when the initial tweets have been received, append them
          $scope.tweets = tweets;

          console.log($scope.tweetCount + ' initial tweets loaded, setting up stream for: ' + $scope.currentSearch);

          // set up the live stream
          socket.emit('startTweetStream', $scope.currentSearch);
        });
      }
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

  });
