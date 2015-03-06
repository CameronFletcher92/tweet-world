'use strict';

angular.module('tweetWorldApp')
  .controller('MainCtrl', function ($scope, $http, socket, Tweet) {
    // scope variables
    $scope.tweets = [];
    $scope.searchText = '';
    $scope.searchDate = new Date();
    $scope.currentSearch = '';

    $scope.searchTweets = function() {
      if ($scope.searchText === '') {
        return;
      }

      console.log('creating new search for: ' + $scope.searchText);

      // reset the tweets
      $scope.tweets.length = 0;

      // tell the server to get the initial tweets then setup stream
      console.log($scope.searchDate);
      socket.emit('query', $scope.searchText, $scope.searchDate);

      // update the current search
      $scope.currentSearch = $scope.searchText;

      // reset the search text
      $scope.searchText = '';
    };

    // when the initial tweets are received, prepend them
    socket.on('tweets-existing', function(tweets){
      console.log(tweets.length + " initial tweets loaded");
      console.log(tweets);
      $scope.tweets.unshift(tweets);
    });

    // when a tweet is pushed, prepend it to the tweets
    socket.on('tweet-live', function(tweet) {
      $scope.tweets.unshift(tweet);
    });


    // load cached tweets
    /*
    var tweets = Tweet.query(function () {
      console.log(tweets);
    });
    */

  });
