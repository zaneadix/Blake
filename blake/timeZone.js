const g = require("../google");
const { dbClient, getUserData, setUserData } = require("../db");

let timeZoneMatch = /(timezone|tz)\s*([a-z,\- ]+)?/i;

const handleTimeZone = async message => {
  let { author, channel, content, member } = message;

  let address = timeZoneMatch.exec(content)[2];

  if (address) {
    try {
      let timeZone = await g.getTimeZone(address);

      let userData = await getUserData(author);
      userData.timeZone = timeZone;
      console.log("USER DATA", userData);

      await setUserData(author, userData);
      channel.send(`I've set your time zone to ${timeZone}, ${member}!`);
    } catch (error) {
      console.log(error);
      channel.send(`Sorry, ${member}, I dropped the ball. ${error.message}`);
    }
    return;
  }

  let userData = await getUserData(author);
  console.log("USER DATA", userData);

  channel.send(
    `Your time zone is currently set to ${userData.timeZone}, ${member}!`
  );
};

module.exports = {
  handleTimeZone
};
