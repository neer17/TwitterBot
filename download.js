const axios = require('axios')
const path = require('path')
const fs = require('fs')

const GIF = 'animated_gif'
const PHOTO = 'photo'
const VIDEO = 'video'
var mediaPath = null

exports.download = async function (url, type) {
    const response = await axios({
        method: 'get',
        url,
        responseType: 'stream'
    })

    //  determining the type of media and getting their path
    if (type === GIF){
        mediaPath = path.join(__dirname, 'memes', `meme0.mp4`)
    } else if (type === VIDEO) {
        mediaPath = path.join(__dirname, 'memes', `meme0.mp4`)
    } else if (type === PHOTO) {
        mediaPath = path.join(__dirname, 'memes', `meme0.jpg`)
    }

    //  writing the media into the file
    response.data.pipe(fs.createWriteStream(mediaPath))

    return new Promise((resolve, reject) => {
        response.data.on('end', () => {
            resolve()
        })

        response.data.on('error', err => {
            reject(err)
        })
    })
}
