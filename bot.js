var Twitter = require('twitter');
var fs = require('fs');
var axios = require('axios');
var path = require('path');
var sharp = require('sharp');

var keys = require('./config');

var client = new Twitter(keys);

const GIF = "animated_gif";
const PHOTO = "photo";

console.log('bot started');




//  declaring a global variable to count no of memes
global.memeCount = 0;

//
var friendsString = '';

/**
 * downloading the memes
 */

async function download(url, type) {
    var response = await axios({
        method: 'get',
        url,
        responseType: 'stream'
    });

    var imagePath;

    //  determining the type of media
    if (type === GIF) {
        imagePath = path.join(__dirname, 'memes', `meme${memeCount++}.mp4`);
    } else if (type === PHOTO) {
        imagePath = path.join(__dirname, 'memes', `meme${memeCount++}.jpg`);
    }

    //  writing the media into the file
    response.data.pipe(fs.createWriteStream(imagePath));

    new Promise((resolve, reject) => {
        response.data.on('end', () => {
            resolve();
        });

        response.data.on('error', (err) => {
            reject(err);
        });
    });
}

//  getting the ids by screen_name
//  then following the users

var params = {
    // screen_name: 'thememesbotdank,neeraj_sewani,got_memes_,throneofmemes,knowyourmeme,thememebot,thehoodmemes,wholesomememe,animememedaily,memesonhistory,brainmemes,gameplay'
    screen_name: 'neeraj_sewani'
}
client.get('users/lookup', params).then((response) => {
    /* console.log(response);
    fs.writeFileSync('./output.json', JSON.stringify(response), 'utf8');
    console.log('file saved'); */

    var arrayOfIds = [];

    for (let i = 0; i < response.length; i++) {
        arrayOfIds.push(response[i].id_str + ',');
        friendsString += response[i].id_str + ',';

        //  following the users
        client.post('friendships/create', {
            user_id: arrayOfIds[i]
        }).then((response) => {
            console.log('==> ', response.screen_name, ' <== is followed');
        }).catch((err) => {
            if (err)
                console.log('already following ==> ', response[i].screen_name, '<==');
        })
    }

    //  attaching a stream to read all the tweets of the users present in "friendsString"
    client.stream('statuses/filter', {
        follow: friendsString
    }, function (stream) {

        stream.on('data', function (event) {
            fs.writeFile('./dataFromStream.json', JSON.stringify(event), 'utf8');
            console.log('stream data saved');

            //  on a TWEET
            if (!event.retweeted_status) {
                console.log('TWEET');

                //  no of media objects depends on the no of images
                //  here considering only one image is tweeted
                var mediaObject = event.extended_entities.media[0];

                //  determining the type of media
                if (mediaObject.type === GIF) {
                    //  it would be video
                    var gifUrl = mediaObject.video_info.variants[0].url;

                    //  downloading the gif
                    download(gifUrl, GIF);

                } else if (mediaObject.type === PHOTO) {
                    var photoUrl = mediaObject.media_url;

                    //  downloading the photo
                    download(photoUrl, PHOTO);

                    //
                    var stats = fs.statSync('./memes/meme0.jpg');
                    var sizeInBytes = stats["size"];
                    var sizeInMBs = sizeInBytes / 1000000.0;

                    console.log('size of photos in MBs ==> ', sizeInMBs);

                    //  uploading media

                    //  step-1 INIT
                    client.post('media/upload', {
                        command: 'INIT',
                        total_bytes: sizeInBytes,
                        media_type: 'photo/jpg',

                    }).then((response) => {
                        var mediaId = response.media_id_string;

                        //  reading the file that is to be uploaded
                        var pathOfFileToRead = path.join(__dirname, 'memes', 'meme0.jpg');
                        
                        var binaryEncodedPhoto, base64EncodedPhoto;

                        binaryEncodedPhoto = fs.readFileSync(pathOfFileToRead, {encoding: 'binary'});
                        base64EncodedPhoto = fs.readFileSync(pathOfFileToRead, {encoding: 'base64'});

                        //  step-2 APPEND
                        client.post('media/upload', {
                            command: 'APPEND',
                            media_id: mediaId,
                            media: binaryEncodedPhoto,
                            media_data: base64EncodedPhoto,
                            segment_index: 1
                        }).then((response) => {

                            console.log(response);

                           /*  //  STEP-3 STATUS
                            client.get('media/upload', {
                                command: 'STATUS',
                                media_id: mediaId
                            }).then((response) => {
                                console.log(response);
                            }).catch((err) => {
                                console.log('step-3');
                                console.log(err);
                            }) */

                            client.post('media/upload', {
                            command: 'FINALIZE',
                            media_id: mediaId
                            }).then((response) => {
                            console.log(response)
                            }).catch((err) => {
                            console.log('step-4');
                            console.log(err);
                            });

                            }).catch((err) => {
                                console.log('step-2');
                                console.log(err);
                            })

                        }).catch((err) => {
                            console.log('step-1')
                            console.log(err);
                        })
                }

            } else {
                console.log('RETWEET')
            }

        });

        stream.on('error', function (error) {
            console.log(error);

        });
    });

    console.log(friendsString);

}).catch((err) => {
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