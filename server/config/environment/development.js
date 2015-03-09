'use strict';

// Development specific configuration
// ==================================
module.exports = {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost/tweetworld-dev'
  },

  // reset the db on server quit
  seedDB: false
};
