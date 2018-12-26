const Discord = require("discord.js");
const g = require("./google");
const { isLog, imageExts, timeUnits, getLogValues } = require("./utils");
const dayIsAfter = require("date-fns/is_after");
const differenceInDays = require("date-fns/difference_in_days");

let authToken = process.env.DISCORD_TOKEN;
let client = new Discord.Client();
// let logBuffer = {};

const logResponse = (message, feedback, success = false) => {
  message
    .react(success ? "👍" : "❌")
    .then(() => {})
    .catch(error => console.log(error));

  if (feedback) {
    message.channel
      .send(feedback)
      .then(() => {})
      .catch(error => console.log(error));
  }
};

client
  .login(authToken)
  .then(() => {})
  .catch(error => console.error(error));

client.on("ready", () => {
  console.log(client.user.username, "is up and running.");
});

client.on("message", async message => {
  let { attachments, author, channel, content } = message;
  if (author.bot) return;

  /**
   * WORKOUT LOGS
   */
  if (channel.name === "log-your-workout" && isLog(content)) {
    let { date, day, month, year, time, timeUnit, exercise } = getLogValues(
      content
    );

    if (!timeUnits.includes(timeUnit)) {
      logResponse(
        message,
        `Sorry, ${author}! The time unit you entered (*${timeUnit}*) isn't one I know. Make sure to use one of these: *${timeUnits.join(
          ", "
        )}*`
      );
      return;
    }

    if (date) {
      if (!(month >= 1 && month <= 12)) {
        logResponse(
          message,
          `Quit goofin' off, ${author}! Month should be a number from 1 to 12. You entered *${month}*.`
        );
        return;
      }

      let dayCount = new Date(year, month, 0).getDate();
      if (!(day >= 1 && day <= dayCount)) {
        logResponse(
          message,
          `Quit being silly, ${author}! Day should be a number from 1 and ${dayCount} for the month you gave. You entered *${day}*.`
        );
        return;
      }

      date = new Date(year, month - 1, day);
      if (dayIsAfter(date, new Date())) {
        logResponse(
          message,
          `Date alert, ${author}! The date you entered is in the future. Quit horsin' around!`
        );
        return;
      }
      if (differenceInDays(new Date(), date) > 5) {
        logResponse(
          message,
          `Date alert, ${author}! The date you entered is outside the 5 day window. Please contact an admin to have your workout logged manually.`
        );
        return;
      }
    }

    date = date || Date.now();

    let tallied = await g.tallyWorkout({
      userName: author.username,
      exercise,
      duration: `${time}${timeUnit}`,
      date
    });

    let imageSubmitted = false;
    if (attachments.size) {
      let attachment = attachments.values().next().value;
      imageSubmitted =
        attachment.filename && imageExts.test(`.${attachment.filename}`);
    }

    logResponse(message, null, true);

    return;
  }

  /**
   * MENTIONS
   */
  if (message.isMentioned(client.user)) {
    message.reply("yes?");
  }
});
