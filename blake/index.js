const client = require("./client");
const crons = require("./crons");
const { provideHelp, updateHelpMenu } = require("./help");
const { getActivity } = require("./activity");
const { isLogMessage, logWorkout } = require("./log");
const { handleTimeZone } = require("./timeZone");
const { REACTIONS } = require("../utils");

let commandMatcher;

client.on("ready", () => {
  console.log(client.user.username, "is up and running.");
  commandMatcher = new RegExp(`^<@!?${client.user.id}>\\s+([a-z]+)`);
  crons(client);
});

client.on("messageReactionAdd", (reaction, user) => {
  updateHelpMenu(reaction, user);
});

client.on("message", handleMessage);

client.on("messageUpdate", async (original, edit) => {
  let success = edit.reactions.cache.get(REACTIONS.SUCCESS);

  if (!success || !success.users.cache.get(client.user.id)) {
    handleMessage(edit);
  }
});

async function handleMessage(message) {
  let { author, channel, content } = message;

  if (author.bot) return;

  console.log("MESSAGE", author.username, "said", `"${content}"`);

  if (message.mentions.has(client.user)) {
    let command = (commandMatcher.exec(content) || [])[1];

    switch (command) {
      case "help":
        provideHelp(message);
        return;

      case "activity":
        await getActivity(message);
        return;

      case "log":
        if (isLogMessage(message)) {
          await logWorkout(message);
        }
        return;

      case "thank":
      case "thanks":
        message.channel.send(`You heckin' betchya, ${message.author}!`);
        return;

      case "tz":
      case "timezone":
        await handleTimeZone(message);
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

  let isLog = isLogMessage(message);
  if (isLog) {
    await logWorkout(message);
  }
}
