'use strict';

angular.module('tweetWorldApp')
  .directive('globe', function () {
    return {
      template: '<div style="height: 100%; width: 100%;"></div>',
      restrict: 'EA',
      scope: {
        points: "=points"
      },
      link: function (scope, element, attrs) {
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

        var div = element.find('div')[0];
        var urls = {
          earth: 'assets/images/world.jpg',
          bump: 'assets/images/bump.jpg',
          specular: 'assets/images/specular.jpg'
        };

        // create a globe
        var globe = new Globe(div, urls);
        globe.init();
        var lastAdd = new Date();

        scope.$watchCollection('points', function (newValue, oldValue) {
          var newPoints = _.difference(newValue, oldValue);

          if (newValue.length == 0) {
            globe.removeAllBlocks();
          } else {
            // add each new point
            for (var i = 0; i < newPoints.length; i++) {
              var point = {
                color: '#0000FF',
                size: 2,
                height: 10,
                lat: newPoints[i][0],
                lon: newPoints[i][1]
              };

              // get the number of points at the same co-ords
              var matchingPoints = _.filter(oldValue.concat(newValue), function (existingPoint) {
                return ((existingPoint[0] == point.lat && existingPoint[1] == point.lon));
              });

              // do some modification if there were matches
              if (matchingPoints.length > 1) {
                // base height on number of matches
                point.height = matchingPoints.length * point.height;
                // base color on number of matches
                point.color = colorFn(matchingPoints.length);
              }

              var timeDiff = new Date() - lastAdd;

              // only do the animation and recentering within some time for performance
              if (timeDiff >= 100) {
                globe.addLevitatingBlock(point);
                globe.center({lat: point.lat, lon: point.lon});
              } else {
                globe.addBlock(point);
              }
              lastAdd = new Date();
            }
          }

        });
      }
    };
  });
