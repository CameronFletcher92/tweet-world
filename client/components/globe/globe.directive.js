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

        scope.$watchCollection('points', function(newValue, oldValue) {
          var newPoints = newValue.diff(oldValue);
          console.log(newPoints);

          if (newValue.length == 0) {
            globe.removeAllBlocks();
          } else {
            for (var i = 0; i < newPoints.length; i++) {
              var point = {
                color: '#FF0000',
                size: 5,
                lat: newPoints[i][0],
                lon: newPoints[i][1]
              };

              globe.addLevitatingBlock(point);
              globe.center({lat: point.lat, lon: point.lon});
            }
          }

        });
      }
    };
  });

// array diffing
Array.prototype.diff = function(a) {
  return this.filter(function(i) {return a.indexOf(i) < 0;});
};

