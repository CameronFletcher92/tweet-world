'use strict';

var _ = require('lodash');
var Tweet = require('./tweet.model');

// Get list of tweets
exports.index = function(req, res) {
  var searchDate = req.query.searchDate;
  var searchText = req.query.searchText;

  console.log("search date = " + searchDate);

  // get the tweets with the keyword
  var tweets = Tweet.find()
    .where('searchText').equals(searchText);

  // if the date was included, get those
  if (searchDate) {
    tweets = tweets.where('date').gt(searchDate);
  }

  tweets.exec(function(err, tweets) {
    if(err) { return handleError(res, err); }
    return res.json(200, tweets);
  });

};

// Creates a new tweet in the DB.
exports.create = function(req, res) {
  Tweet.create(req.body, function(err, tweet) {
    if(err) { return handleError(res, err); }
    return res.json(201, tweet);
  });
};


function handleError(res, err) {
  return res.send(500, err);
}
