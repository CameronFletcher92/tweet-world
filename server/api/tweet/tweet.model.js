'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TweetSchema = new Schema({
  searchText: String,
  tweetId: String,
  userpic: String,
  text: String,
  geoPoint: { latitude: Number, longitude: Number},
  date: Date
});

module.exports = mongoose.model('Tweet', TweetSchema);
