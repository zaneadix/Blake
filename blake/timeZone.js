const g = require("../google");
const { dbClient, getUserData, setUserData } = require("../db");

let timeZoneMatch = /(timezone|tz)\s+([a-z,\- ]+)/i;

const handleTimeZone = async message => {
  let { author, channel, content, member } = message;

  let address = timeZoneMatch.exec(content)[2];

  if (address) {
    try {
      let timeZone = await g.getTimeZone(address);

      let userData = await getUserData(author);
      userData.timeZone = timeZone;

      await setUserData(author, userData);
      channel.send(
        `Successfully set your time zone to ${timeZone}, ${member}!`
      );
    } catch (error) {
      console.log(error);
      channel.send(`Sorry, ${member}, I dropped the ball. ${error.message}`);
    }
  }
};

module.exports = {
  handleTimeZone
};
