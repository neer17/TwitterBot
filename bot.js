var Twitter = require('twitter')
var fs = require('fs')
var axios = require('axios')
var path = require('path')
var mongoose = require('mongoose')
var http = require('http')

// var util = require('util')
// var sharp = require('sharp')

mongoose.connect(`mongodb://neer17:pontiac633725@ds231374.mlab.com:31374/twitter_bot_2018`)

var keys = require('./config')
var TweetIdsModel = require('./Schema/TweetIdSchema')

var client = new Twitter(keys)

/* //  promisifying 'setTimeout'
const setTimeoutPromise = util.promisify(setTimeout) */

global.memeCount = 0
const GIF = 'animated_gif'
const PHOTO = 'photo'
const VIDEO = 'video'

console.log('bot started')

//  declaring it to store comma seperated ids of all the users
//  whom are being followed
var friendsString = ''

//
// var mediaIds = []
var arrayOfIds = []
var newLatestTweetId = 1
var splittedStatus
var status
var usersTweets
var i = 0
var j = 0
var l = 0
var m = 0
var totalFollowing
var params1
var recentTweetIds = []
var firstTime = true
var paramWithoutSinceId
var paramWithSinceId
var mediaType

/**
 * downloading the memes
 */

async function download(url, type) {
  var response = await axios({
    method: 'get',
    url,
    responseType: 'stream'
  })

  var imagePath

  //  determining the type of media
  if (type === GIF || type === VIDEO) {
    imagePath = path.join(__dirname, 'memes', `meme0.mp4`)
  } else if (type === PHOTO) {
    imagePath = path.join(__dirname, 'memes', `meme0.jpg`)
  }

  //  writing the media into the file
  response.data.pipe(fs.createWriteStream(imagePath))

  return new Promise((resolve, reject) => {
    response.data.on('end', () => {
      resolve()
    })

    response.data.on('error', err => {
      reject(err)
    })
  })
}

//  following people based on their id
async function followPeople(id) {
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

//  getting the ids by screen_name
//  then following the users

// video_params = {"itsnotgonewell"}

var params = {
  screen_name: 'memesonhistory,got_memes_,dankmemesgang,thememesbotdank,throneofmemes,knowyourmeme,thehoodmemes,animememedaily,brainmemes,gameplay,footballmemesco,soccermemes,trollfootball'
}

/* var params = {
  screen_name: 'memesonhistory,got_memes_,throneofmemes,dankmemesgang,footballmemesco'
} */

/* var params = {
  screen_name: 'gameplay,historytolearn,itsharrypotter'
} */

/* var params = {
  screen_name: 'thememesbotdank,knowyourmeme,thehoodmemes',animememedaily,brainmemes'
} */

/* var params = {
  screen_name: 'ffs_omg'
} */

client
  .get('users/lookup', params)
  .then(response => {
    //  creating a comma seperated list of ids of the people to follow
    //  and storing it in 'friendsString'
    //  and then following them
    arrayOfIds = []

    for (let i = 0; i < response.length; i++) {
      arrayOfIds.push(response[i].id_str)
      friendsString += response[i].id_str + ','

      //  following the users
      followPeople(arrayOfIds[i])
    }

    totalFollowing = arrayOfIds.length

    console.log('total following ==> ', totalFollowing)
    console.log(arrayOfIds)

    //  calling 'checkForNewerTweet' when 'getLatestTweetId()' gets resolved
    getLatestTweetId()
    /* .then(() => {
          setTimeout(function func1() {
            checkForNewerTweet().then(() => {
              setTimeout(func1, 1000 * 10)
            }).catch((err) => {
              if (err.message === 'Cannot read property \'id_str\' of undefined') {
                console.log('Old Tweet')
              } else if (err.message === 'Cannot read property \'media\' of undefined') {
                console.log('Tweet with no media')
              } else {
                console.log(err)
              }
              setTimeout(func1, 1000 * 10)
            })
          }, 1000 * 10)
        }).catch((err) => {
          console.log(err)
        }) */
  }).catch((err) => {
    console.log(err)
  })

/**
 * END of users/lookup
 */

//  gretting an 'recentTweetIds' array of latest tweet ids of all the followed users
function getLatestTweetId() {
  console.log('inside getLatestTweetId')
  //  for the first time not including the 'since_id'
  //  after getting the 'newLatestTweetId' from the first tweet
  //  updating the 'params'
  params1 = {
    user_id: arrayOfIds[l],
    count: 1,
    exclude_replies: true,
    include_rts: false
  }

  return new Promise((resolve, reject) => {
    var setIntervalHandler = setInterval(() => {
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

          //  finding existing tweet ids, deleting them and saving the latest ones
          TweetIdsModel.find({}).then((foundObject) => {
            console.log(foundObject)

            return TweetIdsModel.deleteMany({})
          }).then((deletedObject) => {
            console.log(deletedObject)

            var tweetIds = new TweetIdsModel()
            tweetIds.tweetIds = recentTweetIds
            return tweetIds.save()
          }).then((savedObject) => {
            console.log(savedObject)

            clearInterval(setIntervalHandler)
            resolve()
          }).catch((err) => {
            console.log(err)
          })
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
function checkForNewerTweet() {
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

/**
 * END checkForNewerTweet
 */

function primary1(params1, index) {
  return new Promise((resolve, reject) => {
    //  following would return tweets in chronological order
    client.get('statuses/user_timeline', params1).then((tweets) => {
      console.log('step 1 \t getting tweets of a user')

      //  storing the value of tweets for step 3
      usersTweets = tweets

      /* fs.writeFileSync(path.join(__dirname, 'tweets.json'), JSON.stringify(tweets))
      console.log('written into the file') */

      /**
       * ERROR prone
       */
      //  getting the tweet id
      //  in case 'newLatestTweetId' is the latest then it would get redirected to the
      //  catch block
      newLatestTweetId = tweets[0].id_str
      /* fs.appendFileSync(path.join(__dirname, 'since_ids.json'), JSON.stringify(newLatestTweetId)) */

      //  if there is any new tweet then updating the tweet id
      //  of old tweet with the new tweet id
      recentTweetIds.splice(index, 1, newLatestTweetId)
      console.log('index ==> ', index, '\n')
      console.log('primary1 ==> recentTweetIds ==> ', recentTweetIds)
      /* fs.appendFileSync(path.join(__dirname, 'since_ids_after_splice.json'), JSON.stringify(recentTweetIds))
       */
      //  checking if tweets have media
      /**
       * ERROR in case of no media
       */
      var hasMedia = tweets[0].extended_entities.media[0]
      if (hasMedia) {
        mediaType = hasMedia.type

        //  determining the type of media
        if (mediaType === PHOTO) {
          console.log('media type ==> PHOTO')

          var mediaUrl = hasMedia.media_url

          //  returning a promise returned by download method
          //  for promise chaining
          return download(mediaUrl, PHOTO)
        } else if (mediaType === GIF) {
          //  it would be video
          var gifUrl = hasMedia.video_info.variants[1].url

          //  returning a promise
          return download(gifUrl, GIF)
        } else {
          var videoUrl = hasMedia.video_info.variants[1].url

          //  returning a promise
          return download(videoUrl, VIDEO)
        }
      }
    }).then((response) => {
      console.log('step 2')
      console.log('media downloaded successfully')

      var base64EncodedMedia

      if (mediaType === GIF) {
        base64EncodedMedia = fs.readFileSync(
          path.join(__dirname, 'memes', 'meme0.mp4'), {
            encoding: 'base64'
          }
        )
      } else if (mediaType === PHOTO) {
        base64EncodedMedia = fs.readFileSync(
          path.join(__dirname, 'memes', 'meme0.jpg'), {
            encoding: 'base64'
          }
        )
      } else {
        base64EncodedMedia = fs.readFileSync(
          path.join(__dirname, 'memes', 'meme0.mp4'), {
            encoding: 'base64'
          }
        )
      }
      //  uploading the media and then tweeting it using 'media_id'
      //  returning the promise
      return client
        .post('media/upload', {
          media_data: base64EncodedMedia
        })
    }).then((response) => {
      console.log('step 3 \t uploading media')

      var mediaId = response.media_id_string

      /* fs.writeFileSync(path.join(__dirname, 'uploadedMediaData.json'), JSON.stringify(response)) */

      console.log('written into uploadedMediaData')

      //  getting the status and removing the url part of it
      splittedStatus = usersTweets[0].text.split('https')
      status = splittedStatus[0]

      //  tweeting the media
      //  returning a promise
      return client
        .post('statuses/update', {
          status,
          media_ids: mediaId
        })
    }).then((response) => {
      console.log('step 4 \t tweeting')
      if (response) {
        console.log('Tweeted successfully')
        resolve()
      }
    }).catch((err) => {
      if (err.message === 'Cannot read property \'0\' of undefined') {
        return reject('Tweet does not contain any media')
      } else if (err /* .message === 'Cannot read property \'id_str\' of undefined' */ ) {
        reject(err)
      }
    })
  })
}

//  attaching a stream to read all the tweets of the users
//  present in 'friendsString'
/* client.stream(
     'statuses/filter', {
       follow: friendsString
     },
     function (stream) {
       stream.on('data', function (event) {
         //  writing what is obtained from the stream
         fs.writeFileSync(
           path.join(__dirname, 'dataFromStream.json'),
           JSON.stringify(event)
         )

         //  if the media is present
         if (event.extended_entities) {
           //  on a TWEET
           if (!event.retweeted_status) {
             var whoTweeted = event.user.screen_name
             var id = event.user.id_str

             //  no of media objects depends on the no of images
             //  here considering only one image is tweeted
             var mediaObject = event.extended_entities.media[0]

             //  if the tweet has media then only progressing forward
             if (mediaObject != null) {

               //  getting the status of the tweet
               //  as with a media 'text' contains both the caption
               //  and the link of the media
               var completeStatusWithMediaLink = event.text
               var res = completeStatusWithMediaLink.split('https')
               var status = res[0]

               //  determining the type of media
               if (mediaObject.type === GIF) {
                 //  it would be video
                 var gifUrl = mediaObject.video_info.variants[0].url

                 console.log(whoTweeted, '==> TWEETED GIF')

                 //  downloading the gif
                 download(gifUrl, GIF)
                     .then(() => {
                         var base64EncodedImage = fs.readFileSync(
                             path.join(__dirname, 'memes', 'meme0.mp4'), {
                                 encoding: 'base64'
                             }
                         )

                         //  uploading the media and then tweeting it using 'media_id'
                         client
                             .post('media/upload', {
                                 media_data: base64EncodedImage
                             })
                             .then(response => {
                                 var mediaId = response.media_id_string

                                 //  tweeting the media
                                 client
                                     .post('statuses/update', {
                                         status,
                                         media_ids: mediaId
                                     })
                                     .then(response => {
                                         if (response) console.log('Tweeted successfully')
                                     })
                             })
                     })
                     .catch(err => {
                         console.log('Error in download method for media = GIF ')
                         console.log(err)
                     })

               } else if (mediaObject.type === PHOTO) {
                 var photoUrl = mediaObject.media_url

                 console.log(whoTweeted, '==> TWEETED PHOTO')

                 //  downloading the photo
                 download(photoUrl, PHOTO)
                     .then(() => {

                         var base64EncodedImage = fs.readFileSync(
                             path.join(__dirname, 'memes', 'meme0.jpg'), {
                                 encoding: 'base64'
                             }
                         )

                         //  uploading the media and then tweeting it using 'media_id'
                         client
                             .post('media/upload', {
                                 media_data: base64EncodedImage
                             })
                             .then(response => {
                                 var mediaId = response.media_id_string

                                 //  tweeting the media
                                 client
                                     .post('statuses/update', {
                                         status,
                                         media_ids: mediaId
                                     })
                                     .then(response => {
                                         if (response) console.log('Tweeted successfully')
                                     }).catch((err) => {
                                         console.log('Error in tweeting')
                                         console.log(err)
                                     })
                             }).catch((err) => {
                                 console.log(err)

                             })
                     })
                     .catch(err => {
                         console.log('Error in download method in media = PHOTO')
                         console.log(err)
                     })
               }
             } else {
               console.log('Tweet without media')
             }
           }
           //  on RETWEET
           else {
             var whoTweeted = event.retweeted_status.user.screen_name
             var id = event.retweeted_status.user.id_str
             var mediaObject = event.extended_entities.media[0]
             var mediaId = mediaObject.id_str
             var memeUrl = mediaObject.media_url

             //  getting the status of the tweet
             //  as with a media 'text' contains both the caption
             //  and the link of the media
             var completeStatusWithMediaLink = event.retweeted_status.text
             var res = completeStatusWithMediaLink.split('https')
             var status = res[0]

             //  storing media ids in an array
             mediaIds.push(mediaId)

             if (mediaObject.type === PHOTO) {
               console.log(whoTweeted, ' ==> RETWEETED PHOTO')

               //  downloading the photo
                           download(memeUrl, PHOTO)
                             .then(() => {
                               var base64EncodedImage = fs.readFileSync(
                                 path.join(
                                   __dirname,
                                   'memes',
                                   'meme0.jpg'
                                 ),
                                 {
                                   encoding: 'base64'
                                 }
                               )

                               //  uploading the media and then tweeting it using 'media_id'
                               client
                                 .post(
                                   'media/upload',
                                   {
                                     media_data: base64EncodedImage
                                   }
                                 )
                                 .then(response => {
                                   var mediaId = response.media_id_string

                                   //  tweeting the media
                                   client
                                     .post(
                                       'statuses/update',
                                       {
                                         status,
                                         media_ids: mediaId
                                       }
                                     )
                                     .then(
                                       response => {
                                         if (response)
                                           console.log(
                                             'Inside RETWEET ==> Tweeted successfully'
                                           )
                                       }
                                     )
                                     .catch(err => {
                                       console.log('Error in tweeting')
                                       console.log(err)
                                     })
                                 })
                                 .catch(err => {
                                   console.log(err)
                                 })
                             })
                             .catch(err => {
                               console.log('Error in download method in media = PHOTO')
                               console.log(err)
                             })
             } else if (mediaObject.type === GIF) {
               console.log(whoTweeted, ' ==> RETWEETED GIF')
             }
           }
         } else {
           var isARetweet = event.retweeted_status
           var username = isARetweet ?
             event.retweeted_status.user.screen_name :
             event.user.screen_name

           console.log(username, ' ==> TWEETED with no media')
         }
       })

       stream.on('error', function (error) {
         console.log(error)
       })

       console.log('TEMP log in stream')
     }
   )
   */
/* })
  .catch(err => {
    console.log(err)
  }) */

/**
 * START getting the user id
 */

/*
var params = {
    screen_name: 'thememesbotdank'
}

client.get('friends/list', params).then((response) => {
    fs.writeFileSync('./output.json', JSON.stringify(response), 'utf8')
    console.log('file saved')

    let friendsList = response.users

    //  following the friends of the user mentioned in 'params'

    //  'friendships/create' in case the user is already being
    //  followed it can get resolved
    for (let i = 0 i < friendsList.length i++) {
        //  getting the array of ids of all friends of the user
        var friendsIds = []
        friendsIds.push(friendsList[i].id_str)

        //  getting comma seerated string of user ids
        //  for '@see follow'
        friendsString += friendsList[i].id_str + ','

        client.post('friendships/create', {
            user_id: friendsList[i].id_str
        }).then((response) => {
            console.log('==> ', response.screen_name, ' <== is followed')
        }).catch((err) => {
            if (err)
                console.log('already following ==> ', friendsList[i].screen_name, '<==')
        })
    }

    console.log('friendsString ==> ', friendsString)

    client.stream('statuses/filter', {
        follow: friendsString
    }, function (stream) {
        stream.on('data', function (event) {
            fs.appendFile('./dataFromStream.json', JSON.stringify(response), 'utf8')
            console.log('stream data saved')
        })

        stream.on('error', function (error) {
            fs.writeFile('./streamError.json', JSON.stringify(response), 'utf8')
            console.log('Error in the stream')
        })
    })
}).catch((err) => {
    if (err)
        console.log(err)
}) */