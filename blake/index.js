const client = require('./client');
const crons = require('./crons');
const { logWorkout } = require('./logWorkout');
const { REACTIONS } = require('../utils');

let commandMatcher;

client.on('ready', () => {
  console.log(client.user.username, 'is up and running.');
  commandMatcher = new RegExp(`^${client.user}\\s+([a-z]+)`);
  crons(client);
});

client.on('message', handleMessage);

client.on('messageUpdate', async (original, edit) => {
  let success = edit.reactions.get(REACTIONS.SUCCESS);
  if (!success || !success.users.get(client.user.id)) {
    handleMessage(edit);
  }
});

async function handleMessage(message) {
  let { author, channel, content } = message;

  if (author.bot) return;

  if (message.isMentioned(client.user)) {
    let command = (commandMatcher.exec(content) || [])[1];
    console.log(command);

    switch (command) {
      case 'help':

      case 'log':
        await logWorkout(message);
        return;

      case undefined:
        break;

      default:
        channel.send(
          `Sorry ${author}, I don't recognize the command \`${command}\`. If you'd like to know how I can help you, use the \`help\` command.`
        );
        return;
    }
  }

  if (channel.name === 'log-your-workout') {
    await logWorkout(message);
    return;
  }
}
