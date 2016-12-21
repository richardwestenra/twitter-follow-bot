# twitter-follow-bot

A Node.js twitter bot that randomly follows and unfollows people. It uses the [`Twit`](https://github.com/ttezel/twit "Twit's Githb repo") Twitter API Client for Node.

## Setting things up

Create a file called `config.js` to store your Twitter oauth credentials and the list of users whose followers you're interested in. It should look like this:
```javascript
module.exports = {
    consumer_key: '...',
	consumer_secret: '...',
	access_token: '...',
	access_token_secret: '...',
    screenNames : [ "screen_name1", "screen_name2" ]
}
```
For more information about how to create your Twitter API keys [red this](https://twittercommunity.com/t/how-to-get-my-api-key/7033 "How to get my api key") - you will need to configure your application with the **read-write-with-direct messages** permission level.

*Note:* A twitter 'screen_name' is the string after the '@' (e.g. @bot 'screen_name' would be 'bot')

## Note
As Twitter can black-list your application for calling their API too many times, the bot is configured to perform every action after a 65 second `timeout`. For more information, please read [Twitter's API Rate Limits](https://dev.twitter.com/rest/public/rate-limiting "Twitter API Rate Limits").