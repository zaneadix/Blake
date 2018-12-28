const Discord = require("discord.js");
const g = require("./google");
const {
  isLog,
  imageExts,
  timeUnits,
  getLogValues,
  MATCHERS
} = require("./utils");
const dayIsAfter = require("date-fns/is_after");
const differenceInDays = require("date-fns/difference_in_days");
const formatDate = require("date-fns/format");

let authToken = process.env.DISCORD_TOKEN;
let client = new Discord.Client();
let submissionWindow = 7;
// let logBuffer = {};

/**
 * TODO
 * * WORK ON DATE PARSING
 * * API ERROR HANDLING
 */

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
  let { attachments, author, channel, content, guild, member } = message;
  if (author.bot) return;

  // console.log(guild);
  // console.log(member.roles);

  let image;
  if (attachments.size) {
    let attachment = attachments.values().next().value;
    image =
      attachment.filename && MATCHERS.IMAGE_EXTS.test(`.${attachment.filename}`)
        ? attachment
        : image;
  }

  /**
   * WORKOUT LOGS
   */
  if (channel.name === "log-your-workout" && isLog(content)) {
    let { date, day, month, year, time, timeUnit, exercise } = getLogValues(
      content
    );

    if (MATCHERS.MINUTE.test(timeUnit)) {
      timeUnit = "minute";
    } else if (MATCHERS.HOUR.test(timeUnit)) {
      timeUnit = "hour";
    } else {
      logResponse(
        message,
        `Sorry, ${author}! The time unit you entered (*${timeUnit}*) isn't one I know. Make sure to use one of these: *${timeUnits.join(
          ", "
        )}*`
      );
      return;
    }
    timeUnit = time > 1 ? `${timeUnit}s` : timeUnit; //pluralize

    if (date) {
      if (!(month >= 1 && month <= 12)) {
        logResponse(
          message,
          `Quit goofin' off, ${author}! Month should be a number from 1 to 12. You entered *${month}*.`
        );
        return;
      }

      if (!/\d{4}/.test(year)) {
        logResponse(
          message,
          `Quit goofin' off, ${author}! It's definitely not the year ${year}*.`
        );
        return;
      }

      let dayCount = new Date(year, month, 0).getDate();
      if (!(day >= 1 && day <= dayCount)) {
        logResponse(
          message,
          `Quit being silly, ${author}! Day should be a number between 1 and ${dayCount} for the month you gave. You entered *${day}*.`
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
      if (differenceInDays(new Date(), date) > submissionWindow) {
        logResponse(
          message,
          `Date alert, ${author}! The date you entered is outside the ${submissionWindow} day window. Please contact an admin to have your workout logged manually.`
        );
        return;
      }
    }

    date = date || new Date(); //default date is today

    try {
      await g.tallyWorkout({
        user: author,
        exercise,
        duration: `${time} ${timeUnit}`,
        date,
        logTime: formatDate(Date.now(), "M-D-YY h:mma"),
        imageURL: image && image.url
      });
    } catch (error) {
      console.log("CAUGHT AT THE TOP!!!", error);
      logResponse(
        message,
        `Oh crap, ${author}! I tried to log your workout but got this error. **${
          error.message
        }**.`
      );
      return;
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
