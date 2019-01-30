const Twitter = require('twitter')
const path = require('path')
const config = require('./config')

const client = new Twitter(config)

const pathToMovie = path.join(__dirname, 'memes', 'gif1.gif')
const mediaType = 'image/gif' // `'video/mp4'` is also supported
const mediaData = require('fs').readFileSync(pathToMovie)
const mediaSize = require('fs').statSync(pathToMovie).size

initUpload() // Declare that you wish to upload some media
  .then(appendUpload) // Send the data for the media
  .then(finalizeUpload) // Declare that you are done uploading chunks
  .then(mediaId => {
    // You now have an uploaded movie/animated gif
    // that you can reference in Tweets, e.g. `update/statuses`
    // will take a `mediaIds` param.

    client
      .post('statuses/update', {
        media_ids: mediaId
      }).then((result) => {
        console.log(result)
    }).catch((err) => {
      console.log(err)
    })
  })

/**
 * Step 1 of 3: Initialize a media upload
 * @return Promise resolving to String mediaId
 */
function initUpload () {
  return makePost('media/upload', {
    command: 'INIT',
    total_bytes: mediaSize,
    media_type: mediaType
  }).then(data => data.media_id_string)
}

/**
 * Step 2 of 3: Append file chunk
 * @param String mediaId    Reference to media object being uploaded
 * @return Promise resolving to String mediaId (for chaining)
 */
function appendUpload (mediaId) {
  console.log(`media id ==> ${mediaId}`)

  return makePost('media/upload', {
    command: 'APPEND',
    media_id: mediaId,
    media: mediaData,
    segment_index: 0
  }).then(data => mediaId)
}

/**
 * Step 3 of 3: Finalize upload
 * @param String mediaId   Reference to media
 * @return Promise resolving to mediaId (for chaining)
 */
function finalizeUpload (mediaId) {
  return makePost('media/upload', {
    command: 'FINALIZE',
    media_id: mediaId
  }).then(data => mediaId)
}

/**
 * (Utility function) Send a POST request to the Twitter API
 * @param String endpoint  e.g. 'statuses/upload'
 * @param Object params    Params object to send
 * @return Promise         Rejects if response is error
 */
function makePost (endpoint, params) {
  return new Promise((resolve, reject) => {
    client.post(endpoint, params, (error, data, response) => {
      if (error) {
        reject(error)
      } else {
        resolve(data)
      }
    })
  })
}