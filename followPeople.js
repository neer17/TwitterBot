const Twitter = require('twitter')

const {twitter} = require('./config/config')

const client = new Twitter(twitter)

exports.followPeople = async function (id) {
    try {
        var response = await client.post('friendships/create', {
            user_id: id
        })

        console.log('==> ', response.screen_name, '<== is followed')

        return new Promise((resolve, reject) => {
            resolve()
        })
    } catch (err) {
        console.log('==> ', response.screen_name, '<== is already being followed')

        return new Promise((resolve, reject) => {
            reject(err)
        })
    }
}
