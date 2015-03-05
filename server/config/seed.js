/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var Tweet = require('../api/tweet/tweet.model');

Tweet.find({}).remove(function() {
  /*
  Tweet.create({
    userpic: "some image",
    text: "a test tweet",
    geo: [100,200],
    date: Date.now()
  }, {
    userpic: "some image",
    text: "a test tweet",
    geo: [100,200],
    date: Date.now()
  }, {
    userpic: "some image",
    text: "a test tweet",
    geo: [100,200],
    date: Date.now()
  },  {
    userpic: "some image",
    text: "a test tweet",
    geo: [100,200],
    date: Date.now()
  },  {
    userpic: "some image",
    text: "a test tweet",
    geo: [100,200],
    date: Date.now()
  },{
    userpic: "some image",
    text: "a test tweet",
    geo: [100,200],
    date: Date.now()
  });
  */
});
