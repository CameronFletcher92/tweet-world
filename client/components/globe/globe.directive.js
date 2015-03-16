'use strict';

angular.module('tweetWorldApp')
  .directive('globe', function () {
    return {
      template: '<div style="height: 100%; width: 100%;"></div>',
      restrict: 'EA',
      scope: {
        points: '=',
        heightPerPoint: '=?',
        pointSize: '=?',
        heightCap: '=?'
      },

      controller: function ($scope, $element) {
        // check optionals
        $scope.heightsPerPoint = $scope.heightsPerPoint || 10;
        $scope.pointSize = $scope.pointSize || 3;
        $scope.heightCap = $scope.heightCap || 500;

        // private functions
        function rgbToHex(r, g, b) {
          return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }

        function colorFn(x) {
          var r = 0, g = 0, b = 0;

          if (x == 1) {
            // 1 match is blue
            b = 255;
          }
          else if (x <= 4) {
            // up to 4 matches should be green
            g = 255;
          } else {
            // more than 4 matches is red
            r = 255;
          }

          return rgbToHex(r, g, b);
        }

        // Points collection changed
        var _lastAdd = new Date();
        var _globePoints = [];

        $scope.$watchCollection('points', function (newValue, oldValue) {
          // remove the blocks if points were cleared
          if (newValue.length == 0) {
            $scope.globe.removeAllBlocks();
            return;
          }

          // get the changes to the points
          var newPoints = _.difference(newValue, oldValue);

          // iterate through the new points
          _.forEach(newPoints, function(newPoint) {

            // see if there is already a globe point for these co-ords
            var matchingGlobePoint = _.first(_.filter(_globePoints, function(globePoint) {
              return globePoint.lat == newPoint[0] && globePoint.lon == newPoint[1];
            }));

            // get the count of points with these co-ords (the magnitude)
            var newMagnitude = _.filter(oldValue.concat(newValue), function (existingPoint) {
              return existingPoint[0] == newPoint[0] && existingPoint[1] == newPoint[1];
            }).length;

            var newGlobePoint;

            // if there is, update its properties
            if (matchingGlobePoint) {

              // if there are duplicates in the cache, skip them (only create a block for their co-ords once)
              if (!matchingGlobePoint.magnitude || matchingGlobePoint.magnitude == newMagnitude) {
                return;
              }

              // remove its block from the scene, and the globe point from the list (it will be re-added)
              $scope.globe.removeBlock(matchingGlobePoint.block);
              matchingGlobePoint.block = null;
              var index = _globePoints.indexOf(matchingGlobePoint);
              _globePoints.splice(index, 1);

              // update its properties
              matchingGlobePoint.magnitude = newMagnitude;
              matchingGlobePoint.height = $scope.heightPerPoint * newMagnitude;
              matchingGlobePoint.color = colorFn(newMagnitude);
              newGlobePoint = matchingGlobePoint;

            } else {
              // create a new globe point, with multiplied attributes
              newGlobePoint = {
                lat: newPoint[0],
                lon: newPoint[1],
                size: $scope.pointSize,
                magnitude: newMagnitude,
                height: $scope.heightPerPoint * newMagnitude,
                color: colorFn(newMagnitude)
              };
            }

            // cap the height
            if (newGlobePoint.height >= $scope.heightCap) {
              newGlobePoint.height = $scope.heightCap;
            }

            // add to the scene and globePoints
            var newBlock;

            // only do the animation and recentering within some time for performance
            var timeDiff = new Date() - _lastAdd;
            if (timeDiff >= 100) {
              newBlock = $scope.globe.addLevitatingBlock(newGlobePoint);
              $scope.globe.center(newGlobePoint);
            } else {
              newBlock = $scope.globe.addBlock(newGlobePoint);
            }
            _lastAdd = new Date();
            newGlobePoint.block = newBlock;
            _globePoints.push(newGlobePoint);

          });
        });
      },

      link: function (scope, element, attrs) {
        var div = element.find('div')[0];
        var urls = {
          earth: 'assets/images/world.jpg',
          bump: 'assets/images/bump.jpg',
          specular: 'assets/images/specular.jpg'
        };
        // create a globe
        var globe = new Globe(div, urls);
        globe.init();
        // assign the globe to the scope
        scope.globe = globe;
      }
    };
  });
