const g = require('../google');
const { getUserData, setUserData } = require('../db');

let timeZoneMatch = /(timezone|tz)\s*([a-z,\- ]+)?/i;

const handleTimeZone = async message => {
  let { author, channel, content } = message;

  let address = timeZoneMatch.exec(content)[2];

  if (address) {
    try {
      let timeZone = await g.getTimeZone(address);

      let userData = await getUserData(author);
      userData.timeZone = timeZone;

      await setUserData(author, userData);
      channel.send(`I've set your time zone to ${timeZone}, ${author}!`);
    } catch (error) {
      console.log(error);
      channel.send(`Sorry, ${author}, I dropped the ball. ${error.message}`);
    }
    return;
  }

  let userData = await getUserData(author);

  channel.send(`Your time zone is currently set to ${userData.timeZone}, ${author}!`);
};

module.exports = {
  handleTimeZone,
};
