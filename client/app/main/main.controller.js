'use strict';

angular.module('tweetWorldApp')
  .controller('MainCtrl', function ($scope, $http, socket) {
    $scope.tweets = [];
    $scope.searchText = '';
    $scope.currentSearch = '';

    $scope.searchTweets = function() {
      if ($scope.searchText === '') {
        return;
      }

      console.log('creating new search for: ' + $scope.searchText);

      // tell the server to start a tweet stream
      socket.socket.emit('q', $scope.searchText);

      // update the current search
      $scope.currentSearch = $scope.searchText;

      // reset the tweets and search text
      $scope.tweets = [];
      $scope.searchText = '';

      // when a tweet is pushed, push it onto the list of tweets
      socket.socket.on('tweet', function(tweet) {
        console.log('tweet received: ' + tweet.id);
        /*
         if ($scope.tweets.length == 10) {
         $scope.tweets.shift();
         }
         */
        $scope.tweets.push(tweet);
      });

    };

    /*
    $scope.awesomeThings = [];

    $http.get('/api/things').success(function(awesomeThings) {
      $scope.awesomeThings = awesomeThings;
      socket.syncUpdates('thing', $scope.awesomeThings);
    });

    $scope.addThing = function() {
      if($scope.newThing === '') {
        return;
      }
      $http.post('/api/things', { name: $scope.newThing });
      $scope.newThing = '';
    };

    $scope.deleteThing = function(thing) {
      $http.delete('/api/things/' + thing._id);
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('thing');
    });
    */
  });
