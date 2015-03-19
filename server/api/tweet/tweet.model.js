'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TweetSchema = new Schema({
  searchText: String,
  userpic: String,
  text: { type: String, index: true },
  coordinates: { type: [Number], index: '2dsphere' },
  place: String,
  date: {type: Date, index: true }
});

module.exports = mongoose.model('Tweet', TweetSchema);
