var mongoose = require('mongoose')
var Schema = require('mongoose').Schema

var TweetIdSchema = new Schema({
    tweetIds: {
        type: Array,
        required: true
    }
})

module.exports = mongoose.model('TweetIds', TweetIdSchema)