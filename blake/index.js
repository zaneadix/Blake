let client = require('./client');
let crons = require('./crons');
let { provideHelp, updateHelpMenu } = require('./help');
let { getActivity } = require('./activity');
let { isLogMessage, logWorkout } = require('./log');
let { handleTimeZone } = require('./timeZone');
let { REACTIONS } = require('../utils');
let logger = require('../logger');

let commandMatcher;

client.on('ready', () => {
  console.log(client.user.username, 'is up and running.');
  commandMatcher = new RegExp(`^<@!?${client.user.id}>\\s+([a-z]+)`);
  crons(client);
});

client.on('invalidated', () => {
  logger.info(`CLIENT INVALIDATED. REBOOTING...`);
  process.exit();
});

client.on('messageReactionAdd', (reaction, user) => {
  updateHelpMenu(reaction, user);
});

client.on('message', handleMessage);

client.on('messageUpdate', async (original, edit) => {
  let success = edit.reactions.cache.get(REACTIONS.SUCCESS);

  if (!success || !success.users.cache.get(client.user.id)) {
    handleMessage(edit);
  }
});

async function handleMessage(message) {
  let { author, channel, content } = message;

  console.log('HANDLING:', content);

  if (author.bot) return;

  if (message.mentions.has(client.user)) {
    let command = (commandMatcher.exec(content) || [])[1];

    switch (command) {
      case 'help':
        provideHelp(message);
        return;

      case 'activity':
        await getActivity(message);
        return;

      case 'log':
        if (isLogMessage(message)) {
          await logWorkout(message);
        }
        return;

      case 'thank':
      case 'thanks':
        message.channel.send(`You heckin' betchya, ${message.author}!`);
        return;

      case 'tz':
      case 'timezone':
        await handleTimeZone(message);
        return;

      case undefined:
        break;

      default:
        channel.send(
          `Sorry ${author}, I don't recognize the command \`${command}\`. If you'd like to know how I can help you, use the \`help\` command.`,
        );
        return;
    }
  }

  let isLog = isLogMessage(message);
  if (isLog && channel.name === process.env.TFC_WORKOUT_CHANNEL_NAME) {
    await logWorkout(message);
  }
}
