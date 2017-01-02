/**
 * Twitter bot that follows random people who follow certain users
 * and unfollows random followers of yours
 */

const Markov = require('markov');
const Twit = require('twit');
const config = process.env || require('./config');

const markov = new Markov(1);
const twit = new Twit(config);
const screen_names = config.screen_names.split(',');
const { search_terms } = config;
const seconds = 65;

setInterval(() => {
  if (Math.random() > 0.05) {
    getRandom([
      follow,
      tweetHorse,
      getTweet.bind(this, 'recent', retweet),
      getTweet.bind(this, 'recent', fav),
    ])();
  } else {
    unfollow();
  }
}, seconds * 1000);


function getTweet(type, callback) {
  twit.get('search/tweets', {
      q: search_terms,
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
  var randScreenName = getRandom(screen_names);
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


// Say something weird and horse_js-ish
function tweetHorse() {
  var randScreenName = getRandom(screen_names);
  twit.get('statuses/user_timeline', { screen_name: randScreenName })
    .then(({ data }) => data.map(d => d.text)
      .join(' ')
      .split(' ')
      .filter((word) => !word.match('@') && !word.match('http') && !word.match('RT'))
      .join(' ')
    )
    .then((tweets) => new Promise((resolve) => {
      markov.seed(tweets, () => {
        var tweet = markov.respond(tweets).reduce((a, b) => {
          var tmp = `${a} ${b}`;
          return (tmp.length > 140) ? a : tmp;
        }, '').trim();
        resolve(tweet);
      });
    }))
    .then(tweet => {
      twit.post('statuses/update', { status: tweet });
      console.log(`Tweeted "${tweet}"`);
    })
    .catch(console.error);
}


function getRandom(arr) {
  return arr[ Math.floor(arr.length * Math.random()) ];
}