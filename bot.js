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

/**
 * downloading the memes
 */

async function download (url, type) {
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
async function followPeople (id) {
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
  screen_name: 'memesonhistory,footballmemesco' /* 'thememesbotdank,neeraj_sewani,footballmemesco,got_memes_,throneofmemes,knowyourmeme,thememebot,thehoodmemes,animememedaily,memesonhistory,brainmemes,gameplay' */
  // screen_name: 'neeraj_sewani'
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

    /**
     * END of users/lookup
     */

    //  for the first time not including the 'since_id'
    //  after getting the 'newLatestTweetId' from the first tweet
    //  updating the 'params'
    params = {
      user_id: arrayOfIds[1],
      count: 1,
      exclude_replies: true,
      include_rts: true
    }

    //  getting the tweets after every x seconds
    setInterval(() => {
      //  following would return tweets in chronological order
      client.get('statuses/user_timeline', params).then((tweets) => {
        fs.writeFileSync(path.join(__dirname, 'tweets.json'), JSON.stringify(tweets))
        console.log('written into the file')

        //  getting the tweet id
        //  in case 'newLatestTweetId' is the latest then it would get redirected to the
        //  catch block
        newLatestTweetId = tweets[0].id_str

        //  adding 'since_id' to params
        params = {
          user_id: arrayOfIds[1],
          count: 1,
          exclude_replies: true,
          include_rts: true,
          since_id: newLatestTweetId
        }

        //  checking if tweets have media
        var hasMedia = tweets[0].entities.media[0]
        if (hasMedia) {
          var mediaType = hasMedia.type

          //  determining the type of media
          if (mediaType === 'photo') {
            console.log('media type ==> PHOTO')

            var mediaUrl = hasMedia.media_url

            download(mediaUrl, PHOTO).then(() => {
              console.log('media downloaded successfully')

              //  encoding the downloaded image
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

                  fs.writeFileSync(path.join(__dirname, 'uploadedMediaData.json'), JSON.stringify(response))

                  console.log('written into uploadedMediaData')

                  //  getting the status and removing the url part of it
                  splittedStatus = tweets[0].text.split('https')
                  status = splittedStatus[0]

                  //  tweeting the media
                  client
                    .post('statuses/update', {
                      status,
                      media_ids: mediaId
                    })
                    .then(response => {
                      if (response) console.log('Tweeted successfully')
                    }).catch((err) => {
                      console.log(err)
                    })
                })
            }).catch((err) => {
              console.log(err)
            })
          }
        }
      }).catch((err) => {
        if (err.message === 'Cannot read property \'id_str\' of undefined') {
        } else {
          console.log(err.message)
        }
      })
    }, 10000)

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
  })
  .catch(err => {
    console.log(err)
  })

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
