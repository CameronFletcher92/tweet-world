'use strict';

angular.module('tweetWorldApp')
  .controller('MainCtrl', function ($scope, $http, socket, Tweet) {
    $scope.tweets = [];
    $scope.searchText = '';
    $scope.currentSearch = '';

    // load cached tweets
    /*
    var tweets = Tweet.query(function () {
      console.log(tweets);
    });
    */

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
      $scope.tweets = [];
      $scope.searchText = '';

      // when a tweet is pushed, push it onto the list of tweets
      socket.socket.on('tweet', function(tweet) {
        $scope.tweets.push(tweet);
      });

    };
  });
