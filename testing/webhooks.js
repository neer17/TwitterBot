const express = require("express")
const bodyParser = require("body-parser")
const twitterWebhooks = require("twitter-webhooks")
const https = require("https")

const app = express()
app.use(bodyParser.json())

const PORT = process.env.PORT || 443

const userActivityWebhook = twitterWebhooks.userActivity({
  serverUrl: "https://ed5af18a.ngrok.io",
  route: "https://ed5af18a.ngrok.io/", //default : '/'
  consumerKey: "OiQqT1gANZhYy7GjPR2xoW6gs",
  consumerSecret: "LyG5goTBGxyuDlgq73G1CC5YTdBf95iqwVFVx7LYLtBN7Zo0Sy",
  accessToken: "1017764619337646080-LM0G9WqWxI7zoAnqUd4nWhV53EKU48",
  accessTokenSecret: "hBLXanm089wDi10Y4wyCB12No3HdxhE74LW15kepCvTVL",
  environment: "dev", //default : 'env-beta'
  app
})

//Register your webhook url - just needed once per URL
userActivityWebhook.register()

//Subscribe for a particular user activity
userActivityWebhook
  .subscribe({
    userId: "1017764619337646080",
    accessToken: "1017764619337646080-LM0G9WqWxI7zoAnqUd4nWhV53EKU48",
    accessTokenSecret: "hBLXanm089wDi10Y4wyCB12No3HdxhE74LW15kepCvTVL"
  })
  .then(function(userActivity) {
    userActivity
      .on("favorite", data => console.log(userActivity.id + " - favorite"))
      .on("tweet_create", data =>
        console.log(userActivity.id + " - tweet_create")
      )
      .on("follow", data => console.log(userActivity.id + " - follow"))
      .on("mute", data => console.log(userActivity.id + " - mute"))
      .on("revoke", data => console.log(userActivity.id + " - revoke"))
      .on("direct_message", data =>
        console.log(userActivity.id + " - direct_message")
      )
      .on("direct_message_indicate_typing", data =>
        console.log(userActivity.id + " - direct_message_indicate_typing")
      )
      .on("direct_message_mark_read", data =>
        console.log(userActivity.id + " - direct_message_mark_read")
      )
      .on("tweet_delete", data =>
        console.log(userActivity.id + " - tweet_delete")
      )
  })
  .catch(console.log)

//listen to any user activity
userActivityWebhook.on("event", (event, userId, data) =>
  console.log(userId + " - favorite")
)

//listen to unknown payload (in case of api new features)
userActivityWebhook.on("unknown-event", rawData => console.log(rawData))

app.listen(PORT, () => {
  console.log("Server is up and running on port", PORT)
})
