const Discord = require("discord.js");
const schedule = require("node-schedule");
var AsciiTable = require("ascii-table");
const dayIsAfter = require("date-fns/is_after");
const differenceInDays = require("date-fns/difference_in_days");
const formatDate = require("date-fns/format");
const addDays = require("date-fns/add_days");
const subDays = require("date-fns/sub_days");

const g = require("./google");
const {
  isLog,
  getLogValues,
  currentTimeZone,
  MATCHERS,
  SUBMISSION_WINDOW,
  TIME_UNITS
} = require("./utils");
const GUILD_ID = process.env.TFC_GUILD;

/**
 * Set East Coast TimeZone
 */
process.env.TZ = "America/New_York";

let authToken = process.env.DISCORD_TOKEN;
let client = new Discord.Client();

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

const getChannel = channelName => {
  let guild = client.guilds.get(GUILD_ID);
  let channel;
  if (guild) {
    channel = guild.channels.find(channel => channel.name === channelName);
  }
  return channel;
};

client
  .login(authToken)
  .then(() => {})
  .catch(error => console.error(error));

client.on("ready", () => {
  // console.log(client.guilds);
  console.log(client.user.username, "is up and running.");
});

client.on("message", async message => {
  let { attachments, author, channel, content, guild, member } = message;
  if (author.bot) return;

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
        `Sorry, ${author}! The time unit you entered (*${timeUnit}*) isn't one I know. Make sure to use one of these: *${TIME_UNITS.join(
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

      // Month without -1 puts it into next month
      // Day set to zero brings it back to last day of current month;
      let dayCount = new Date(year, month, 0).getDate();
      if (!(day >= 1 && day <= dayCount)) {
        logResponse(
          message,
          `Quit being silly, ${author}! Day should be a number between 1 and ${dayCount} for the month you gave. You entered *${day}*.`
        );
        return;
      }

      date = new Date(year, month - 1, day);
      if (dayIsAfter(date, currentTimeZone())) {
        logResponse(
          message,
          `Date alert, ${author}! The date you entered is in the future. Quit horsin' around!`
        );
        return;
      }
      if (differenceInDays(currentTimeZone(), date) > SUBMISSION_WINDOW) {
        logResponse(
          message,
          `Date alert, ${author}! The date you entered is outside the ${submissionWindow} day window. Please contact an admin to have your workout logged manually.`
        );
        return;
      }
    }

    date = date || currentTimeZone(); //default date is today

    try {
      await g.tallyWorkout({
        user: author,
        exercise,
        duration: `${time} ${timeUnit}`,
        date,
        logTime: formatDate(currentTimeZone(), "M-D-YY h:mm:sa"),
        imageURL: image && image.url
      });
    } catch (error) {
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

/**
  JOBS
 
  *    *    *    *    *    *
  ┬    ┬    ┬    ┬    ┬    ┬
  │    │    │    │    │    │
  │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
  │    │    │    │    └───── month (1 - 12)
  │    │    │    └────────── day of month (1 - 31)
  │    │    └─────────────── hour (0 - 23)
  │    └──────────────────── minute (0 - 59)
  └───────────────────────── second (0 - 59, OPTIONAL)

 */

/**
 * Every Monday at 8am
 * I'm looking for workouts between (exclusive)
 * last Sunday and today (Monday)...
 * FROM: 8 days ago
 * TO: Today at 00:00;
 */
const weekleyResult = schedule.scheduleJob("* 8 * * 1", async () => {
  // const weekleyResult = schedule.scheduleJob("*/10 * * * * *", async () => {
  // TESTING
  // console.log("getting weekley results");
  let to = currentTimeZone(new Date().setHours(0, 0, 0, 0));
  let from = subDays(to, 8);

  let counts;
  try {
    counts = await g.getWorkoutCounts(from, to);
  } catch (error) {
    console.log("Failed to get weekley results");
    console.log(error);
    return;
  }

  let table = new AsciiTable(
    `Week of ${formatDate(addDays(from, 1), "MMM D")}`
  );
  table.setHeading("Member", "Logged", "Days", "Year");

  Object.keys(counts).forEach(id => {
    let row = counts[id];
    table.addRow(
      row.username,
      row.workoutsLogged,
      row.daysWorkedOut,
      row.yearTotal
    );
  });

  let channel = getChannel("general");

  let message = `
  Hey, Tranquili-nerds! Here's your weekley workout summary.
  **Logged** - Total workouts logged this week.
  **Days** - Total days worked out this week.
  **Year** - Total days worked out this year`;

  if (channel) {
    channel.send(message + "```" + table + "```");
  }
});

/**
 * First day of every month
 * I'm looking for workouts between (exclusive)
 * last Sunday and today (Monday)...
 * FROM: 8 days ago
 * TO: Today at 00:00;
 */
// const monthlyResult = schedule.scheduleJob("* * 1 * *", () => {
//   console.log("getting weekley results");
// });

// let to = currentTimeZone(new Date().setHours(0, 0, 0, 0));
// let from = subDays(to, 8);
// g.getWorkoutCounts(from, to);
