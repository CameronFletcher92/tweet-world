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

      // tell the server to start a tweet stream
      socket.socket.emit('query', $scope.searchText);

      // update the current search
      $scope.currentSearch = $scope.searchText;

      // reset the tweets and search text
      $scope.tweets.length = 0;
      //$scope.tweets = [];
      $scope.searchText = '';

    };

    // when a tweet is pushed, prepend it to the tweets
    socket.socket.on('tweet', function(tweet) {
      $scope.tweets.unshift(tweet);
    });

    // load cached tweets
    /*
    var tweets = Tweet.query(function () {
      console.log(tweets);
    });
    */

  });
