/**
 * When someone follows this would run
 */

const Twitter = require('twitter')
const path = require('path')
const fs = require('fs')
const keys = require('./config')

const client = new Twitter(keys)

//  getting the list of followers
client.get('followers/list', {}).then((res) => {
    fs.writeFileSync(path.join(__dirname, 'followersList.json'), JSON.stringify(res))
    console.log('written into the file')
}).catch((err) => {
    console.log(err)
})