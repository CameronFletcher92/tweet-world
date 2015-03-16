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

            // get the number of points at the same co-ords (including itself)
            var matchingPoints = _.filter(oldValue.concat(newValue), function (existingPoint) {
              return existingPoint[0] == newPoint[0] && existingPoint[1] == newPoint[1];
            });

            var pointCount = matchingPoints.length;

            var newGlobePoint;

            // update the existing block's attributes if the co-ords exist, otherwise create a new one
            if (pointCount > 1) {
              // a point for these co-ordinates already exists, update its block
              var existingGlobePoint = _.first(_.filter(_globePoints, function(point) {
                return point.lat == newPoint[0] && point.lon == newPoint[1];
              }));


              // remove its block from the scene
              $scope.globe.removeBlock(existingGlobePoint.block);
              existingGlobePoint.block = null;

              // fix up its properties, and re-add a block for it
              existingGlobePoint.height = $scope.heightPerPoint * pointCount;
              if (existingGlobePoint.height >= $scope.heightCap) {
                existingGlobePoint.height = $scope.heightCap;
              }
              existingGlobePoint.color = colorFn(pointCount);

              newGlobePoint = existingGlobePoint;

            } else if (pointCount == 1) {
              // create a new globe point, with default attributes
              newGlobePoint = {
                lat: newPoint[0],
                lon: newPoint[1],
                size: $scope.pointSize,
                height: $scope.heightPerPoint,
                color: colorFn(pointCount)
              };

            }

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

            // attach the new block to the globePoint
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
