var Twitter = require('twitter');
var fs = require('fs');
var axios = require('axios');
var path = require('path');
var sharp = require('sharp');

var keys = require('./config');

var client = new Twitter(keys);

//  declaring a global variable to count no of memes
global.memeCount = 0;

/**
 * downloading the memes
 */
/* var imagePath = path.join(__dirname, 'memes', `meme${memeCount++}.jpg`);

async function download() {
    var response = await axios({
        method: 'get',
        url: "http://pbs.twimg.com/media/Dq9atuuXQAUNMAe.jpg",
        responseType: 'stream'
    });

    response.data.pipe(fs.createWriteStream(imagePath));

    new Promise((resolve, reject) => {
        response.data.on('end', () => {
            resolve();
        });

        response.data.on('error', (err) => {
            reject(err);
        });
    });
} */


//  getting the image from the URL
// GET request for remote image

var params = {
    screen_name: 'thememesbotdank',
    count: 1
};

client.get('statuses/home_timeline', params).then((response) => {
    //  getting the user's id_str
    var id_str = response[0].user.id_str;
    console.log(id_str);

    fs.writeFileSync('/output.json',response, 'utf8');

    /* // You can also get the stream in a callback if you prefer.
    client.stream('statuses/filter', {
        follow: id_str
    }, function (stream) {
        stream.on('data', function (event) {
            console.log(event && event.text);
        });

        stream.on('error', function (error) {
            throw error;
        });
    }); */


}).catch((err) => {
    if (err)
        console.log(err);
});