'use strict';

angular.module('tweetWorldApp')
  .factory('Tweet', function ($resource) {
    return $resource('/api/tweets/:id/:controller', {
      id: '@_id'
    });
  });
