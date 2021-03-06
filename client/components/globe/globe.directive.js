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

          if (x <= 3) {
            // 3 match is blue
            b = 255;
          } else if (x <= 6) {
            // up to 6 matches should blue-green
            g = 150;
            b = 150;
          } else if (x <= 9) {
            // up to 9 matches should be green
            g = 255;
          } else if (x <= 12) {
            // up to 12 matches should be green-red
            g = 150;
            r = 150;
          } else {
            r = 255;
          }

          return rgbToHex(r, g, b);
        }

        // Points collection changed
        var _globePoints = [];

        $scope.$watchCollection('points', function (newValue, oldValue) {

          // remove all the globe points (and blocks)
          if (newValue.length <= 1) {
            _globePoints.length = 0;
            $scope.globe.removeAllBlocks();
          }

          // get the changes to the points
          var newPoints = _.difference(newValue, oldValue);

          // iterate through the new points
          _.forEach(newPoints, function(newPoint) {
            // skip any dummy points
            if (newPoint[0] == 0 && newPoint[1] == 0) {
              return;
            }

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
              if (!matchingGlobePoint.magnitude
                || matchingGlobePoint.magnitude == newMagnitude
                || matchingGlobePoint.height == $scope.heightCap) {
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
            newBlock = $scope.globe.addLevitatingBlock(newGlobePoint);
            newGlobePoint.block = newBlock;
            _globePoints.push(newGlobePoint);

            // center the map
            $scope.globe.center(newGlobePoint);
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
