'use strict';

angular.module('tweetWorldApp')
  .directive('globe', function () {
    return {
      template: '<div style="height: 100%; width: 100%;"></div>',
      restrict: 'EA',
      link: function (scope, element, attrs) {
        var div = element.find('div')[0];
        //div.text('this is the globe node');

        var urls = {
          earth: 'assets/world.jpg',
          bump: 'assets/bump.jpg',
          specular: 'assets/specular.jpg'
        };

        // create a globe
        var globe = new Globe(div, urls);
        globe.init();
        //element.text('this is the globe directive');
      }
    };
  });
