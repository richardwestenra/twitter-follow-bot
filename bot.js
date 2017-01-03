/**
 * Twitter bot that finds people who follow certain users or who tweet about certain topics
 * and adds them to lists, and removes users who don't follow me from those lists
 */

const Twit = require('twit');
const config = process.env || require('./config');

const twit = new Twit(config);
const screen_names = config.screen_names.split(',');
const search_terms = config.search_terms.split(',');

const intervals = [60, 600]; // min, max (in seconds)
const otherList = 'web-development-datavis';


// Initialise:
loop();


// Execute on irregular intervals:
function loop() {
  execute();
  setTimeout(loop, randomTime(...intervals));
}


// Do something random:
function execute() {
  var randomList = getRandom(search_terms);
  var randomUser = getRandom(screen_names);
  switch (getRandom([1,2,2,3])) {
    case 1:
      findUserByFollowers(randomUser).then( addToList(otherList) );
      break;
    case 2:
      findUserByTopic(randomList).then( addToList(randomList) );
      break;
    case 3:
      removeFromList( getRandom([randomList, otherList]) );
      break;
  }
}


// Choose a random follower of someone on the list:
function findUserByFollowers(screenName) {
  console.log(`Finding a user who follows @${screenName}...`);
  return twit.get('followers/list', { screen_name: screenName })
    .then(({ data }) => {
      if (!data.users) throw data.errors;
      return data.users.filter((user) => !user.following)
        .map((user) => user.screen_name);
    })
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
    .then(({ data }) => {
      if (!data.statuses) throw data.errors;
      return data.statuses
        .filter((status) => !status.user.following)
        .map((status) => status.user.screen_name)
        .filter(unique);
    })
    .then(getRandom)
    .catch(console.error);
}


// Follow a user, mute them, and add them to a list:
function addToList(list) {
  return (user) => twit.post('lists/members/create', {
      slug: list,
      owner_screen_name: config.username,
      screen_name: user
    })
    .then(({ data }) => {
      if (!data.id) {
        throw data.errors;
      } else {
        console.log(`Added @${user} to the ${list} list.`);
      }
    })
    .catch(console.error);
}


// Remove a random user from a list, if they don't follow me back:
function removeFromList(list) {
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
    .then((user) => twit.post('lists/members/destroy', {
        slug: list,
        owner_screen_name: config.username,
        screen_name: user
      })
      .then(() => user)
    )
    .then((user) => {
      console.log(`Removed @${user} from the ${list} list.`);
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

function randomTime(min, max) {
  return Math.round((Math.random() * (max - min)) + min) * 1000;
}