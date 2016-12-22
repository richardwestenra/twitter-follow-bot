/**
 * Twitter bot that follows random people who follow certain users
 * and unfollows random followers of yours
 */

const Twit = require('twit');
const config = require('./config');

const twit = new Twit(config);
const screenNames = config.screenNames.split(',');
const { searchTerms } = config;
const seconds = 65;

setInterval(() => {
  if (Math.random() > 0.05) {
    getRandom([
      follow,
      getTweet.bind(this, 'popular', retweet),
      getTweet.bind(this, 'recent', fav),
    ])();
  } else {
    unfollow();
  }
}, seconds * 1000);


function getTweet(type, callback) {
  // const elapsed = 86400000 * Math.ceil(Math.random() * 1000);
  // const date = new Date(new Date() - elapsed).toISOString().split('T')[0];

  twit.get('search/tweets', {
      // q: `${searchTerms} since:${date}`,
      q: searchTerms,
      result_type: type,
      count: 50
    })
    .then((resp) => {
      if (resp.data.errors) throw resp.data.errors;
      return resp.data.statuses;
    })
    .then((statuses) => 
      statuses.sort(() =>
        Math.round(Math.random()) - 0.5
        // (b.retweet_count + b.favorite_count) - (a.retweet_count + a.favorite_count)
      )[0]
    )
    .then(callback)
    .catch(console.error);
}

// Retweet a very good tweet
function retweet(tweet) {
  twit.post('statuses/retweet/:id', { id: tweet.id_str })
    .then((resp) => {
      if (resp.data.errors) throw resp.data.errors;
      return resp.data;
    })
    .then((tweet) => {
      console.log(`Retweeted ${tweet.id_str} by @${tweet.retweeted_status.user.screen_name}.`);
    })
    .catch(console.error);
  return tweet;
}

// Favourite a very good tweet
function fav(tweet) {
  twit.post('favorites/create', { id: tweet.id_str })
    .then((resp) => {
      if (resp.data.errors) throw resp.data.errors;
      return resp.data;
    })
    .then((tweet) => {
      console.log(`Favourited ${tweet.id_str} by @${tweet.user.screen_name}.`);
    })
    .catch(console.error);
  return tweet;
}


// Choose a random follower of someone on the list, and follow that user:
function follow() {
  var randScreenName = getRandom(screenNames);
  twit.get('followers/ids', { screen_name: randScreenName })
    .then((resp) => twit.post('friendships/create', { id: getRandom(resp.data.ids) }))
    .then(({ data }) => {
      console.log(`Followed @${data.screen_name}, who also follows @${randScreenName}.`);
    })
    .catch(console.error);
}


// Unfollow someone randomly
function unfollow() {
  twit.get('friends/ids')
    .then((resp) => resp.data.ids)
    .then((ids) => twit.post('friendships/destroy', { id: getRandom(ids)}))
    .then(({ data }) => {
      console.log(`Unfollowed @${data.screen_name}`);
    })
    .catch(console.error);
}


function getRandom(arr) {
  return arr[ Math.floor(arr.length * Math.random()) ];
}