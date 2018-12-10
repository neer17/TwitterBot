var Twitter = require('twitter')
var fs = require('fs')
var axios = require('axios')
var path = require('path')
// var sharp = require('sharp')

var keys = require('./config')

var client = new Twitter(keys)

global.memeCount = 0
const GIF = 'animated_gif'
const PHOTO = 'photo'

console.log('bot started')

//  declaring it to store comma seperated ids of all the users
//  whom are being followed
var friendsString = ''

//
var mediaIds = []
var arrayOfIds = []
var newLatestTweetId = 1
var splittedStatus
var status
var usersTweets
var i = 0
var j = 0
var totalFollowing
var params1
var recentTweetIds = []
var firstTime = true
var paramWithoutSinceId
var paramWithSinceId

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
  if (type === GIF) {
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
  } catch (err) {
    console.log('==> ', response.screen_name, '<== is already being followed')
  }
}

//  getting the ids by screen_name
//  then following the users

var params = {
  screen_name: 'animememedaily'/* ,memesonhistory,got_memes_,throneofmemes,dankmemesgang,thememesbotdank,throneofmemes,knowyourmeme,thehoodmemes,animememedaily,memesonhistory,brainmemes,gameplay' */
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
      friendsString += response[i].id_str + ','

      //  following the users
      followPeople(arrayOfIds[i])
    }

    totalFollowing = arrayOfIds.length

    console.log('total folowing ==> ', totalFollowing)
    console.log(arrayOfIds)

    //  calling '' when 'getLatestTweetId()' gets resolved
    getLatestTweetId().then(() => {
      //
      setTimeout(() => {
        checkForNewerTweet()
      }, 1000)
    })
  }).catch((err) => {
    console.log(err)
  })

/**
 * END of users/lookup
 */

//  gretting an 'recentTweetIds' array of latest tweet ids of all the followed users
function getLatestTweetId() {
  //  for the first time not including the 'since_id'
  //  after getting the 'newLatestTweetId' from the first tweet
  //  updating the 'params'
  params1 = {
    user_id: arrayOfIds[i],
    count: 1,
    exclude_replies: true,
    include_rts: false
  }

  setTimeout(() => {
    client.get('statuses/user_timeline', params1).then((response) => {
      //  storing the 'id_str' of the recent tweet of followings
      recentTweetIds.push(response.id_str)

      i++

      //  when all the ids in 'arrayOfIds' are traversed then returning a promise
      if (i === totalFollowing) {
        i = 0
        return 0
      } else {
        params1 = {
          user_id: arrayOfIds[i],
          count: 1,
          exclude_replies: true,
          include_rts: false
        }
      }
    }).catch((err) => {
      console.log(err)
    })
  }, 1000)

  return new Promise((resolve, reject) => {
    resolve()
  })
}

/**
 * END of getLatestTweetId
 */

// this function would check for any newer tweet by the user after getting
// the latest tweet id by calling 'getLatestTweetId'
function checkForNewerTweet() {
  if (firstTime) {
    if (j < arrayOfIds.length) {

      paramWithoutSinceId = {
        user_id: arrayOfIds[j],
        count: 1,
        exclude_replies: true,
        include_rts: false
      }
      j++
      primary1(paramWithoutSinceId)
    } else {
      j = 0
      firstTime = false

      if (i < recentTweetIds.length) {
        paramWithSinceId = {
          user_id: arrayOfIds[i],
          count: 1,
          exclude_replies: true,
          include_rts: false,
          since_id: recentTweetIds[i]
        }
        i++
        primary1(paramWithSinceId)
      } else {
        i = 0
      }
    }

    /**
     * END checkForNewerTweet
     */
  }

  /* params1 = {
    user_id: arrayOfIds[i],
    count: 1,
    exclude_replies: true,
    include_rts: false,
    since_id: recentTweetIds[i]
  } */

  function primary1(params1) {
    //  getting the tweets after every x seconds
    setInterval(() => {
      console.log('setInterval started')
      console.log(`setInterval starting \t value of i ==> ${i}`)
      console.log(params1)

      //  following would return tweets in chronological order
      client.get('statuses/user_timeline', params1).then((tweets) => {
        console.log('step 1 \t getting tweets of a user')

        //  storing the value of tweets for step 3
        usersTweets = tweets

        fs.writeFileSync(path.join(__dirname, 'tweets.json'), JSON.stringify(tweets))
        console.log('written into the file')

        /**
         * ERROR prone
         */
        //  getting the tweet id
        //  in case 'newLatestTweetId' is the latest then it would get redirected to the
        //  catch block
        newLatestTweetId = tweets[0].id_str
        

        /* // if tweets exist then pushing the id(latest) of the tweet to 'recentTweetsIds' array
        //  else storing the 'newLatestTweetId' which would be the previous tweet's id
        if (tweets) {
          recentTweetIds.push(tweets[0].id_str)
        } else {
          recentTweetIds.push(newLatestTweetId)
        } */

        /**
         * ERROR prone
         */
        //  adding 'since_id' to params
        /* if (arrayOfIds[i]) {
          params1 = {
            user_id: arrayOfIds[i],
            count: 1,
            exclude_replies: true,
            include_rts: false,
            since_id: recentTweetIds[i]
          }
        } else {
          throw new Error('user_id is undefined')
        } */

        //  if value of i exceeds the value of total followings then
        //  re-initializing i to 0 else increasing value of i by 1
        /* if (i === totalFollowing + 1) {
          i = 0
        } else {
          i++
        } */

        // console.log('updated params1 \n', params1)

        //  checking if tweets have media
        var hasMedia = tweets[0].entities.media[0]
        if (hasMedia) {
          var mediaType = hasMedia.type

          //  determining the type of media
          if (mediaType === 'photo') {
            console.log('media type ==> PHOTO')

            var mediaUrl = hasMedia.media_url

            //  returning a promise returned by download method
            //  for promise chaining
            return download(mediaUrl, PHOTO)
          }
        }
      }).then((response) => {
        console.log('step 2')
        console.log('media downloaded successfully')

        //  encoding the downloaded image
        var base64EncodedImage = fs.readFileSync(
          path.join(__dirname, 'memes', 'meme0.jpg'), {
            encoding: 'base64'
          }
        )

        //  uploading the media and then tweeting it using 'media_id'
        //  returning the promise
        return client
          .post('media/upload', {
            media_data: base64EncodedImage
          })
      }).then((response) => {
        console.log('step 3 \t uploading media')

        var mediaId = response.media_id_string

        fs.writeFileSync(path.join(__dirname, 'uploadedMediaData.json'), JSON.stringify(response))

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
        }
      }).catch((err) => {
        if (err/* .message === 'Cannot read property \'id_str\' of undefined' */) {
          console.log(err)
          //  if value of i exceeds the value of total followings then
          //  re-initializing i to 0 else increasing value of i by 1
          /* if (i === totalFollowing + 1) {
            i = 0
          } else {
            i++
          }
  
          params1 = {
            user_id: arrayOfIds[i],
            count: 1,
            exclude_replies: true,
            include_rts: false
          } */
        }

        // console.log(`catch statement \t value of i ==> ${i}`)
      })

      console.log('setInterval ended')
    }, 1000 * 20)
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
