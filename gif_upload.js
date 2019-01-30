const Twitter = require('twitter')
const path = require('path')
const fs = require('fs')

const config = require('./config')
const { followPeople } = require('./followPeople')
const { download } = require('./download')

const client = new Twitter(config)

global.time = 10
const GIF = 'animated_gif'
const PHOTO = 'photo'
const VIDEO = 'video'

console.log('GIF/VIDEO bot started')

var arrayOfIds = []
var newLatestTweetId = 1
var splittedStatus
var status
var usersTweets
var l = 0
var m = 0
var totalFollowing
var params1
var recentTweetIds = []
var paramWithSinceId
var mediaType

/**
 * Getting tweets of users and storing them in an array
 */
var params = {
    screen_name: 'fluff,9gag,neeraj_sewani'
}

client
    .get('users/lookup', params)
    .then(response => {
        //  creating a comma seperated list of ids of the people to follow
        //  and storing it in 'friendsString'
        //  and then following them
        arrayOfIds = []

        for (let i = 0; i < response.length; i++) {
            arrayOfIds.push(response[i].id_str)

            //  following the users
            followPeople(arrayOfIds[i]).then((result) => {
                //  all the people have been followed
            }).catch((err) => {
                console.log(err)
            })
        }

        totalFollowing = arrayOfIds.length

        console.log('total following ==> ', totalFollowing)
        console.log(arrayOfIds)

        //  calling 'checkForNewerTweet' when 'getLatestTweetId()' gets resolved
        getLatestTweetId()
            .then(() => {
                setTimeout(function func1 () {
                    checkForNewerTweet().then(() => {
                        setTimeout(func1, 1000 * time)
                    }).catch((err) => {
                        if (err.message === 'Cannot read property \'id_str\' of undefined') {
                            console.log('Old Tweet')
                        } else if (err.message === 'Cannot read property \'media\' of undefined') {
                            console.log('Tweet with no media')
                        } else {
                            console.log(err)
                        }
                        setTimeout(func1, 1000 * time)
                    })
                }, 1000 * 10)
            }).catch((err) => {
            console.log(err)
        })
    }).catch((err) => {
    console.log(err)
})

//  gretting an 'recentTweetIds' array of latest tweet ids of all the followed users
function getLatestTweetId () {
    console.log('inside getLatestTweetId')
    //  for the first time not including the 'since_id'
    //  after getting the 'newLatestTweetId' from the first tweet
    //  updating the 'params'
    var params1 = {
        user_id: arrayOfIds[l],
        count: 1,
        exclude_replies: true,
        include_rts: false
    }

    return new Promise((resolve, reject) => {
        let setIntervalHandler = setInterval(() => {
            // console.log('inside setInterval')
            return client.get('statuses/user_timeline', params1).then((response) => {
                /* fs.writeFileSync(path.join(__dirname, 'response.json'), JSON.stringify(response))
                console.log('written into the file') */

                //  storing the 'id_str' of the recent tweet of followings
                recentTweetIds.push(response[0].id_str)

                //  when all the ids in 'arrayOfIds' are traversed then returning a promise
                if (l === arrayOfIds.length - 1) {
                    l = 0
                    console.log(recentTweetIds)

                    clearInterval(setIntervalHandler)
                    resolve()
                } else {
                    l++
                    params1 = {
                        user_id: arrayOfIds[l],
                        count: 1,
                        exclude_replies: true,
                        include_rts: false
                    }
                }
            }).catch((err) => {
                if (++l === arrayOfIds.length - 1) {
                    l = 0
                    clearInterval(setIntervalHandler)
                }
                reject(err)
            })
        }, 1000 * 2)
    })
}

/**
 * END of getLatestTweetId
 */

// this function would check for any newer tweet by the user after getting
// the latest tweet id by calling 'getLatestTweetId'
function checkForNewerTweet () {
    console.log('inside checkForNewerTweet')

    return new Promise((resolve, reject) => {
        console.log('since_id ==> ', recentTweetIds[m])

        if (m < recentTweetIds.length) {
            paramWithSinceId = {
                user_id: arrayOfIds[m],
                count: 1,
                exclude_replies: true,
                include_rts: false,
                since_id: recentTweetIds[m]
            }

            return primary1(paramWithSinceId, m).then(() => {
                if (++m === recentTweetIds.length) {
                    m = 0
                }
                resolve()
            }).catch((err) => {
                if (++m === recentTweetIds.length) {
                    m = 0
                }
                reject(err)
            })
        }
    })
}

//  uploading the GIF and VIDEO
function uploadMedia () {
    //    STEP 1 (INIT)
    return client.post('media/upload', {
        command: 'INIT',
        total_bytes: gifSizeInBytes,
        media_type: contentType
    }).then((response) => {
        console.log(`INIT \t response ==> ${JSON.stringify(response)}`)

        mediaIdString = response.media_id_string

        console.log(`media id string ==> ${mediaIdString}`)

        //  step 2 (APPEND)
        return client.post('media/upload', {
            command: 'APPEND',
            media_id: mediaIdString,
            media_data: base64EncodedMedia,
            segment_index: 0
        })
    }).then((response) => {
        console.log(`APPEND \t response ==> ${JSON.stringify(response)}`)

        //  STEP 3 (STATUS)
        return client.get('media/upload', {
            command: 'STATUS',
            media_id: mediaIdString
        })
    }).then((response) => {
        console.log(`STATUS \t response ==> ${response}`)

        //  STEP 4 (FINALIZE)
        return client.post('media/upload', {
            command: 'FINALIZE',
            media_id: mediaIdString
        })
    })
}


/*
/!**
 * Step 1 of 3: Initialize a media upload
 * @return Promise resolving to String mediaId
 *!/
function initUpload() {
    return makePost('media/upload', {
        command: 'INIT',
        total_bytes: mediaSize,
        media_type: mediaType,
    }).then(data => data.media_id_string)
}

/!**
 * Step 2 of 3: Append file chunk
 * @param String mediaId    Reference to media object being uploaded
 * @return Promise resolving to String mediaId (for chaining)
 *!/
function appendUpload(mediaId) {
    return makePost('media/upload', {
        command: 'APPEND',
        media_id: mediaId,
        media: mediaData,
        segment_index: 0
    }).then(data => mediaId)
}

/!**
 * Step 3 of 3: Finalize upload
 * @param String mediaId   Reference to media
 * @return Promise resolving to mediaId (for chaining)
 *!/
function finalizeUpload(mediaId) {
    return makePost('media/upload', {
        command: 'FINALIZE',
        media_id: mediaId
    }).then(data => mediaId)
}

/!**
 * uploading media
 *!/

function uploadMedia(mediaId, status) {
    return client
        .post('statuses/update', {
            // status,
            media_ids: mediaId
        })
}

/!**
 * (Utility function) Send a POST request to the Twitter API
 * @param String endpoint  e.g. 'statuses/upload'
 * @param Object params    Params object to send
 * @return Promise         Rejects if response is error
 *!/
function makePost(endpoint, params) {
    return new Promise((resolve, reject) => {
        client.post(endpoint, params, (error, data, response) => {
            if (error) {
                reject(error);
            } else {
                resolve(data);
            }
        })
    })
}*/
