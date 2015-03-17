'use strict';
var TWEET_FEED_LIMIT = 10;
var RATE_INTERVAL = 1000; // 1 second

angular.module('tweetWorldApp')
  .controller('MainCtrl', function ($scope, $http, socket, Tweet, $mdDialog, $interval) {

    // PRIVATE VARIABLES
    var _now = new Date();
    var _lastSearchDate = null;

    var _liveTweetCount = 0;
    var _lastLiveTweetCount = 0;
    var _newTweetCount = 0;

    var _locationTweetCount = 0;
    var _lastLocationTweetCount = 0;
    var _newLocationTweetCount = 0;

    // SCOPE VARIABLES
    // data collections
    $scope.tweetFeed = [];
    $scope.heatPoints = [];
    $scope.chartPoints = [
      {date: new Date(), rate: 0} // dummy so chart initializes
    ];

    // input variables
    $scope.searchText = 'happy';
    $scope.searchDate = new Date(_now.getUTCFullYear(), _now.getUTCMonth(), _now.getUTCDate(), 0, 0, 0);

    // state variables
    $scope.currentSearch = '';
    $scope.isSearching = false;

    // statistics
    $scope.tweetRate = 0;
    $scope.tweetCount = 0;
    $scope.locationTweetRate = 0;


    // BUTTON HANDLERS
    $scope.stopTweets = function () {
      if ($scope.currentSearch === '') {
        return;
      }

      console.log('stopping stream');
      socket.emit('stopTweetStream', $scope.currentSearch);

      $scope.isSearching = false;
      $scope.tweetRate = 0;
      $scope.locationTweetRate = 0;
    };


    $scope.searchTweets = function () {
      if ($scope.searchText === '') {
        return;
      }

      // convert search text to lowercase and mark as searching
      $scope.searchText = $scope.searchText.toLowerCase();
      $scope.isSearching = true;

      // always reset time series
      _liveTweetCount = 0;
      _lastLiveTweetCount = 0;
      $scope.chartPoints.length = 0;


      // if the search hasn't changed, just restart the stream
      if ($scope.currentSearch === $scope.searchText && _lastSearchDate === $scope.searchDate) {
        console.log('resuming search for: ' + $scope.searchText);
        socket.emit('startTweetStream', $scope.currentSearch);
        return;
      }


      // otherwise, reset values, query cache and restart stream
      console.log('creating new search for: ' + $scope.searchText);

      // update the last search time
      _lastSearchDate = $scope.searchDate;

      // set the current search text
      $scope.currentSearch = $scope.searchText;

      // reset tweet feed/count
      $scope.tweetCount = 0;
      $scope.tweetFeed.length = 0;

      // work-around to force heatmap refresh
      $scope.heatPoints.length = 0;
      $scope.heatPoints.push([0, 0, 0]);

      // get the initial tweets
      Tweet.query({searchText: $scope.searchText, searchDate: $scope.searchDate}).$promise
        .then(function (tweets) {
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


    // SOCKET HANDLERS
    // when a tweet is pushed, prepend it to the tweets
    socket.on('tweet', function (tweet) {
      // discard tweets if search was cancelled
      if (!$scope.isSearching) {
        return;
      }

      // increment the counters
      $scope.tweetCount++;
      _liveTweetCount++;

      // add to the heat points
      if (tweet.coordinates) {
        $scope.heatPoints.push(generateHeatPoint(tweet));
        _locationTweetCount++;
      }

      // prepend the new tweet, pop the end if the array is over size
      $scope.tweetFeed.unshift(tweet);
      if ($scope.tweetFeed.length > TWEET_FEED_LIMIT) {
        $scope.tweetFeed.pop();
      }

    });

    // rate limited by twitter, show the alert
    socket.on('limited', function () {
      $scope.stopTweets();

      $mdDialog.show(
        $mdDialog.alert()
          .title('Rate limited by Twitter')
          .content('Changing the keyword too often results in a rate-limit, just chill out for a bit')
          .ariaLabel('Password notification')
          .ok('Got it!')
      );
    });

    // update the rates collection / current rate metric
    $interval(function () {
      // don't do anything if not searching
      if (!$scope.isSearching) {
        return;
      }

      // get the number of new tweets since last interval
      _newTweetCount = _liveTweetCount - _lastLiveTweetCount;
      _newLocationTweetCount = _locationTweetCount - _lastLocationTweetCount;

      var current = new Date();
      var ratePoint = {
        date: current,
        rate: _newTweetCount,
        locationRate: _newLocationTweetCount
      };

      $scope.chartPoints.push(ratePoint);
      $scope.tweetRate = ratePoint.rate;
      $scope.locationTweetRate = ratePoint.locationRate;

      // set the last count as the current live count
      _lastLiveTweetCount = _liveTweetCount;
      _lastLocationTweetCount = _locationTweetCount;

    }, RATE_INTERVAL);


    // MAP OPTIONS
    $scope.map = {
      defaults: {
        maxZoom: 8,
        minZoom: 2,
        scrollWheelZoom: false
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
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', // black and white
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


    // CHART OPTIONS
    $scope.chartOptions = {
      axes: {
        x: {type: "date", key: "date"},
        y: {type: "linear"}
      },
      series: [
        {
          y: "rate",
          label: "Tweets / second",
          color: "#1A237E",
          axis: "y",
          type: "area",
          thickness: "2px",
          dotSize: 2,
          id: "series_0"
        },
        {
          y: "locationRate",
          label: "Location Tweets / second",
          color: "#536DFE",
          axis: "y",
          type: "area",
          thickness: "2px",
          dotSize: 2,
          id: "series_1"
        }
      ],
      tooltip: {
        mode: "scrubber",
        formatter: function (x, y, series) {
          return x.toLocaleTimeString() + ' had ' + y + ' tweets';
        }
      },
      lineMode: "linear",
      drawLegend: true,
      drawDots: false
    };


    // PRIVATE FUNCTIONS
    // flip the order of the co-ords (map doesn't use geojson)
    // heatmap and globe both expect LAT then LON
    function generateHeatPoint(tweet) {
      return [tweet.coordinates[1], tweet.coordinates[0], 0.2];
      //return [50, 80, 0.2];
    }

    function roundDecimal(decimal) {
      return Math.round(decimal * 100) / 100;
    }
  });
