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

        scope.$watchCollection('points', function(newValue, oldValue) {
          var newPoints = _.difference(newValue, oldValue);

          if (newValue.length == 0) {
            globe.removeAllBlocks();
          } else {
            // add each new point
            for (var i = 0; i < newPoints.length; i++) {
              var point = {
                color: '#0000FF',
                size: 2,
                height: 30,
                lat: newPoints[i][0],
                lon: newPoints[i][1]
              };

              // get the number of points at the same co-ords
              var matchingPoints = _.filter(oldValue.concat(newValue), function(existingPoint) {
                return ((existingPoint[0] == point.lat && existingPoint[1] == point.lon));
              });

              // do some modification if there were matches
              if (matchingPoints.length > 1) {
                console.log("MATCH FOUND!");
                point.height = matchingPoints.length * point.height;
                //point.size = matchingPoints.length * point.size;

                // get the colour
                var r = 0;
                if (70 * matchingPoints.length < 255) {r = 70 * matchingPoints.length} else {r = 255}
                point.color = rgbToHex(r, 0, 0);
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
