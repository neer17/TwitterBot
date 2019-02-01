var fs = require('fs')
const cloudconvert = new (require('cloudconvert'))('Ka0P8iOnqsCTftniman6c7T3R0FCURWXArKHBQoffzsLCykvXxrfqRIHXwXZFhwH')
const axios = require('axios')

cloudconvert.createProcess({
    "inputformat": "flv",
    "outputformat": "mp4"
}, function (process) {
    //  downloading the file
    console.log(`process => ${JSON.stringify(process)}`)
    /*
        axios.get(process).then((response) => {
            console.log(JSON.stringify(response))
        }).catch((err) => {
            console.log(err)
        })*/
});