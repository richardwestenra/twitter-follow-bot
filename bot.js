/**
 * Twitter bot that follows random people who follow certain users
 * and unfollows random followers of yours
 */

const Twit = require('twit');
const config = require('./config');
const twit = new Twit(config);
const seconds = 65;

console.log('Bot: Running');

setInterval(() => {
  if (Math.random() < 0.5) {
    mingle();
  } else {
    prune();
  }
}, seconds * 1000);

// Choose a random follower of one of your followers, and follow that user:
function mingle() {
  var randScreenName = getRandom(config.screenNames);
  twit.get('followers/ids', { screen_name: randScreenName })
    .then((resp) => twit.post('friendships/create', { id: getRandom(resp.data.ids) }))
    .then((resp) => {
      console.log(`Mingle: followed @${resp.data.screen_name}, who also follows @${randScreenName}.`);
    })
    .catch(console.error);
}

// Unfollow someone randomly
function prune() {
  twit.get('friends/ids')
    .then((resp) => resp.data.ids)
    .then((ids) => twit.post('friendships/destroy', { id: getRandom(ids)}))
    .then((resp) => {
      console.log(`Prune: unfollowed @${resp.data.screen_name}`);
    })
    .catch(console.error);
}

function getRandom(arr) {
  return arr[ Math.floor(arr.length * Math.random()) ];
}