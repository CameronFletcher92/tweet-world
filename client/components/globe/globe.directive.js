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
            for (var i = 0; i < newPoints.length; i++) {
              var point = {
                color: '#0000FF',
                size: 2,
                lat: newPoints[i][0],
                lon: newPoints[i][1]
              };

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
