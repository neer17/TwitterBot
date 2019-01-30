const Twitter = require('twitter')

const config = require('./config')

const client = new Twitter(config)

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
