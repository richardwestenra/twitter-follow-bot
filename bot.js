/**
 * Twitter bot that follows+mutes+lists random people 
 * who follow certain users or who tweet about certain topics
 * and unfollows random followers from those lists
 * who don't follow back
 */

const Twit = require('twit');
const config = process.env || require('./config');

const twit = new Twit(config);
const screen_names = config.screen_names.split(',');
const search_terms = config.search_terms.split(',');

const seconds = 65;
const otherList = 'web-development-datavis';

// Do something random on interval:
setInterval(() => {
  var randomList = getRandom(search_terms);
  var randomUser = getRandom(screen_names);
  switch (getRandom([1,2,2,3])) {
    case 1:
      findUserByFollowers(randomUser).then( follow(otherList) );
      break;
    case 2:
      findUserByTopic(randomList).then( follow(randomList) );
      break;
    case 3:
      unfollow( getRandom([randomList, otherList]) );
      break;
  }
}, seconds * 1000);


// Choose a random follower of someone on the list:
function findUserByFollowers(screenName) {
  console.log(`Finding a user who follows @${screenName}...`);
  return twit.get('followers/list', { screen_name: screenName })
    .then(({ data }) => data.users
      .filter((user) => !user.following)
      .map((user) => user.screen_name)
    )
    .then(getRandom)
    .catch(console.error);
}


// Choose a random user tweeting about a topic:
function findUserByTopic(list) {
  console.log(`Finding a user tweeting about ${list}...`);
  return twit.get('search/tweets', {
      q: `${list} -${config.username}`,
      count: 100
    })
    .then((resp) => resp.data.statuses
      .filter((status) => !status.user.following)
      .map((status) => status.user.screen_name)
      .filter(unique)
    )
    .then(getRandom)
    .catch(console.error);
}


// Follow a user, mute them, and add them to a list:
function follow(list) {
  return (user) => twit.post('friendships/create', { screen_name: user })
    .then(({ data }) => twit.post('mutes/users/create', {
      screen_name: data.screen_name
    }))
    .then(({ data }) => {
      console.log(`Followed @${data.screen_name} and added them to list ${list}.`);
      return twit.post('lists/members/create', {
        slug: list,
        owner_screen_name: config.username,
        screen_name: data.screen_name
      });
    })
    .catch(console.error);
}


// Unfollow someone randomly, if they don't follow me back:
function unfollow(list) {
  twit.get('lists/members', {
      slug: list,
      owner_screen_name: config.username,
      skip_status: 1,
      include_entities: false
    })
    .then((resp) => resp.data.users)
    .then((users) => {
      if (!users || !users.length) throw `Error: List '${list}' is empty.`;
      return users.map(user => user.screen_name);
    })
    .then((users) => twit.get('friendships/lookup', {
      screen_name: users
        .sort(shuffle)
        .slice(0,99)
        .join(',')
    }))
    .then((resp) => resp.data
      .filter((user) => user.connections.indexOf('followed_by') < 0)
      .map((user) => user.screen_name)
    )
    .then(getRandom)
    .then((user) => twit.post('friendships/destroy', { screen_name: user }))
    .then(({ data }) => twit.post('mutes/users/destroy', {
      screen_name: data.screen_name
    }))
    .then(({ data }) => {
      console.log(`Unfollowed @${data.screen_name} and removed them from the ${list} list.`);
      return twit.post('lists/members/destroy', {
        slug: list,
        owner_screen_name: config.username,
        screen_name: data.screen_name
      });
    })
    .catch(console.error);
}


function unique(value, index, self) { 
  return self.indexOf(value) === index;
}

function shuffle() {
  return 0.5 - Math.random();
}

function getRandom(arr) {
  return arr[ Math.floor(arr.length * Math.random()) ];
}