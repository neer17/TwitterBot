var Twitter = require("twitter");
var fs = require("fs");
var axios = require("axios");
var path = require("path");
var sharp = require("sharp");

var keys = require("./config");

var client = new Twitter(keys);

global.memeCount = 0;
const GIF = "animated_gif";
const PHOTO = "photo";

console.log("bot started");


//  declaring it to store comma seperated ids of all the users 
//  whom are being followed
var friendsString = '';

/**
 * downloading the memes
 */

async function download(url, type) {
    var response = await axios({
        method: "get",
        url,
        responseType: "stream"
    });

    var imagePath;

    //  determining the type of media
    if (type === GIF) {
        imagePath = path.join(__dirname, "memes", `meme0.mp4`);
    } else if (type === PHOTO) {
        imagePath = path.join(__dirname, "memes", `meme0.jpg`);
    }

    //  writing the media into the file
    response.data.pipe(fs.createWriteStream(imagePath));

    return new Promise((resolve, reject) => {
        response.data.on("end", () => {
            resolve();
        });

        response.data.on("error", err => {
            reject(err);
        });
    });
}

//  following people based on their id
async function followPeople(id) {
    try {
        var response = await client
            .post("friendships/create", {
                user_id: id
            })

        console.log('==> ', response.screen_name, '<== is followed');

    } catch (err) {
        console.log('==> ', response.screen_name, '<== is already being followed');

    }

}

//  getting the ids by screen_name
//  then following the users

var params = {
    screen_name: "thememesbotdank,neeraj_sewani,footballmemesco,got_memes_,throneofmemes,knowyourmeme,thememebot,thehoodmemes,animememedaily,memesonhistory,brainmemes,gameplay"
    // screen_name: 'neeraj_sewani'
};
client
    .get("users/lookup", params)
    .then(response => {

        //  creating a comma seperated list ids of the people to follow
        //  and storing it in "friendsString"
        //  and then following them
        var arrayOfIds = [];

        for (let i = 0; i < response.length; i++) {
            arrayOfIds.push(response[i].id_str);
            friendsString += response[i].id_str + ",";

            //  following the users
            followPeople(arrayOfIds[i])

        }



        //  attaching a stream to read all the tweets of the users
        //  present in "friendsString"
        client.stream(
            "statuses/filter", {
                follow: friendsString
            },
            function (stream) {
                stream.on("data", function (event) {

                    //  writing what is obtained from the stream
                    fs.writeFileSync(path.join(__dirname, 'dataFromStream.json'),
                        JSON.stringify(event))

                    //  if the media is present
                    if (event.extended_entities) {

                        //  on a TWEET
                        if (!event.retweeted_status) {
                            var whoTweeted = event.user.screen_name;
                            console.log(whoTweeted, " ==> TWEETED");

                            //  no of media objects depends on the no of images
                            //  here considering only one image is tweeted
                            var mediaObject = event.extended_entities.media[0];

                            //  if the tweet has media then only progressing forward
                            if (mediaObject != null) {

                                //  getting the status of the tweet
                                //  as with a media "text" contains both the caption
                                //  and the link of the media
                                var completeStatusWithMediaLink = event.text;
                                var res = completeStatusWithMediaLink.split('https');
                                var status = res[0];

                                //  determining the type of media
                                if (mediaObject.type === GIF) {
                                    //  it would be video
                                    var gifUrl = mediaObject.video_info.variants[0].url;

                                    //  downloading the gif
                                    download(gifUrl, GIF)
                                        .then(() => {
                                            var base64EncodedImage = fs.readFileSync(
                                                path.join(__dirname, "memes", "meme0.mp4"), {
                                                    encoding: "base64"
                                                }
                                            );

                                            //  uploading the media and then tweeting it using "media_id"
                                            client
                                                .post("media/upload", {
                                                    media_data: base64EncodedImage
                                                })
                                                .then(response => {
                                                    var mediaId = response.media_id_string;

                                                    //  tweeting the media
                                                    client
                                                        .post("statuses/update", {
                                                            status,
                                                            media_ids: mediaId
                                                        })
                                                        .then(response => {
                                                            if (response) console.log("Tweeted successfully");
                                                        });
                                                });
                                        })
                                        .catch(err => {
                                            console.log("Error in download method for media = GIF ");
                                            console.log(err);
                                        });
                                } else if (mediaObject.type === PHOTO) {
                                    var photoUrl = mediaObject.media_url;

                                    //  downloading the photo
                                    download(photoUrl, PHOTO)
                                        .then(() => {

                                            var base64EncodedImage = fs.readFileSync(
                                                path.join(__dirname, "memes", "meme0.jpg"), {
                                                    encoding: "base64"
                                                }
                                            );

                                            //  uploading the media and then tweeting it using "media_id"
                                            client
                                                .post("media/upload", {
                                                    media_data: base64EncodedImage
                                                })
                                                .then(response => {
                                                    var mediaId = response.media_id_string;

                                                    //  tweeting the media
                                                    client
                                                        .post("statuses/update", {
                                                            status,
                                                            media_ids: mediaId
                                                        })
                                                        .then(response => {
                                                            if (response) console.log("Tweeted successfully");
                                                        }).catch((err) => {
                                                            console.log('Error in tweeting');
                                                            console.log(err);
                                                        })
                                                }).catch((err) => {
                                                    console.log(err);

                                                })
                                        })
                                        .catch(err => {
                                            console.log("Error in download method in media = PHOTO");
                                            console.log(err);
                                        });
                                }
                            } else {
                                console.log('Tweet without media');
                            }

                            //  on RETWEET
                        } else {
                            var whoTweeted = event.retweeted_status.user.screen_name;
                            var mediaObject = event.extended_entities.media[0];
                            var memeUrl = mediaObject.media_url;

                            //  getting the status of the tweet
                            //  as with a media "text" contains both the caption
                            //  and the link of the media
                            var completeStatusWithMediaLink = event.text;
                            var res = completeStatusWithMediaLink.split('https');
                            var status = res[0];


                            if (mediaObject.type === PHOTO) {

                            console.log(whoTweeted, " ==> RETWEETED PHOTO");

                                //  downloading the photo
                                download(memeUrl, PHOTO)
                                    .then(() => {

                                        var base64EncodedImage = fs.readFileSync(
                                            path.join(__dirname, "memes", "meme0.jpg"), {
                                                encoding: "base64"
                                            }
                                        );

                                        //  uploading the media and then tweeting it using "media_id"
                                        client
                                            .post("media/upload", {
                                                media_data: base64EncodedImage
                                            })
                                            .then(response => {
                                                var mediaId = response.media_id_string;

                                                //  tweeting the media
                                                client
                                                    .post("statuses/update", {
                                                        status,
                                                        media_ids: mediaId
                                                    })
                                                    .then(response => {
                                                        if (response) console.log("Inside RETWEET ==> Tweeted successfully");
                                                    }).catch((err) => {
                                                        console.log('Error in tweeting');
                                                        console.log(err);
                                                    })
                                            }).catch((err) => {
                                                console.log(err);

                                            })
                                    })
                                    .catch(err => {
                                        console.log("Error in download method in media = PHOTO");
                                        console.log(err);
                                    });

                            }else if(mediaObject.type === GIF){
                            console.log(whoTweeted, " ==> RETWEETED GIF");
                                
                                
                            }

                        }
                    } else {
                        var isARetweet = event.retweeted_status
                        var username = isARetweet ? event.retweeted_status.user.screen_name :
                            event.user.screen_name;

                        console.log(username, ' ==> TWEETED with no media');
                    }

                });

                stream.on("error", function (error) {
                    console.log(error);
                });

                console.log('TEMP log in stream');

            }
        );
    })
    .catch(err => {
        console.log(err);
    });

/**
 * START getting the user id
 */
/* 
var params = {
    screen_name: 'thememesbotdank'
};

client.get('friends/list', params).then((response) => {
    fs.writeFileSync('./output.json', JSON.stringify(response), 'utf8');
    console.log('file saved');

    let friendsList = response.users;
    



    //  following the friends of the user mentioned in "params"

    //  "friendships/create" in case the user is already being
    //  followed it can get resolved
    for (let i = 0; i < friendsList.length; i++) {
        //  getting the array of ids of all friends of the user
        var friendsIds = [];
        friendsIds.push(friendsList[i].id_str);

        //  getting comma seerated string of user ids
        //  for "@see follow"
        friendsString += friendsList[i].id_str + ',';

        client.post('friendships/create', {
            user_id: friendsList[i].id_str
        }).then((response) => {
            console.log('==> ', response.screen_name, ' <== is followed');
        }).catch((err) => {
            if (err)
                console.log('already following ==> ', friendsList[i].screen_name, '<==');
        })
    }

    console.log('friendsString ==> ', friendsString);

    client.stream('statuses/filter', {
        follow: friendsString
    }, function (stream) {
        stream.on('data', function (event) {
            fs.appendFile('./dataFromStream.json', JSON.stringify(response), 'utf8');
            console.log('stream data saved');
        });

        stream.on('error', function (error) {
            fs.writeFile('./streamError.json', JSON.stringify(response), 'utf8');
            console.log('Error in the stream');
        });
    });
}).catch((err) => {
    if (err)
        console.log(err);
}); */