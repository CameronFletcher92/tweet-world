'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TweetSchema = new Schema({
  userpic: String,
  text: String,
  geo: [Number],
  date: Date
});

module.exports = mongoose.model('Tweet', TweetSchema);
