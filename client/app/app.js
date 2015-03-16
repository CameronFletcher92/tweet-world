'use strict';

angular.module('tweetWorldApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'btford.socket-io',
  'ui.router',
  'ui.bootstrap',
  'ngMaterial',
  'leaflet-directive',
  'n3-line-chart'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $mdThemingProvider) {
    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(true);

    // setup the theme
    $mdThemingProvider.theme('default')
      .primaryPalette('indigo')
      .accentPalette('pink');
  });
