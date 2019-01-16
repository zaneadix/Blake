const Discord = require('discord.js');
const authToken = process.env.DISCORD_TOKEN;
const crons = require('./crons');
const { isLogMessage, logWorkout } = require('./logWorkout');

const client = new Discord.Client();

client
  .login(authToken)
  .then(() => {})
  .catch(error => console.error(error));

client.on('ready', () => {
  console.log(client.user.username, 'is up and running.');
  crons(client);
});

client.on('message', async message => {
  let { author, channel, content } = message;

  if (author.bot) return;

  if (message.isMentioned(client.user)) {
    if (content.match(new RegExp(`^${client.user}\\s+log `))) {
      await logWorkout(message);
      return;
    }
  }

  if (channel.name === 'log-your-workout') {
    await logWorkout(message);
    return;
  }
});
