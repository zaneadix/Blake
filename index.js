const Discord = require("discord.js");
const schedule = require("node-schedule");
const { table } = require("table");
const _uniq = require("lodash/uniq");
const dayIsAfter = require("date-fns/is_after");
const differenceInDays = require("date-fns/difference_in_days");
const formatDate = require("date-fns/format");
// const addDays = require("date-fns/add_days");
const subDays = require("date-fns/sub_days");
// const subMonths = require("date-fns/sub_months");

const g = require("./google");
const {
  flatDate,
  getLogValues,
  isLog,
  Member,
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
    .react(success ? "✅" : "❌")
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
  let {
    attachments,
    author,
    channel,
    content,
    guild,
    member,
    mentions
  } = message;
  if (author.bot) return;

  member = new Member(member);

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
    let {
      date,
      day,
      month,
      year,
      time,
      timeUnit,
      exercise,
      partners
    } = getLogValues(content);

    if (MATCHERS.MINUTE.test(timeUnit)) {
      timeUnit = "minute";
    } else if (MATCHERS.HOUR.test(timeUnit)) {
      timeUnit = "hour";
    } else {
      logResponse(
        message,
        `Sorry, ${member}! The time unit you entered (*${timeUnit}*) is not one I know. Make sure to use one of these: *${TIME_UNITS.join(
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
          `Quit goofin' off, ${member}! Month should be a number from 1 to 12. You entered *${month}*.`
        );
        return;
      }

      if (!/\d{4}/.test(year)) {
        logResponse(
          message,
          `Quit goofin' off, ${member}! It's definitely not the year ${year}.`
        );
        return;
      }

      // Month without -1 puts it into next month
      // Day set to zero brings it back to last day of current month;
      let dayCount = new Date(year, month, 0).getDate();
      if (!(day >= 1 && day <= dayCount)) {
        logResponse(
          message,
          `Quit being silly, ${member}! Day should be a number between 1 and ${dayCount} for the month you gave. You entered *${day}*.`
        );
        return;
      }

      date = new Date(year, month - 1, day);
      if (dayIsAfter(date, flatDate())) {
        logResponse(
          message,
          `Date alert, ${member}! The date you entered is in the future. Quit horsin' around!`
        );
        return;
      }

      if (differenceInDays(flatDate(), date) > SUBMISSION_WINDOW) {
        logResponse(
          message,
          `Date alert, ${member}! The date you entered is outside the ${SUBMISSION_WINDOW} day window. Please contact an admin to have your workout logged manually.`
        );
        return;
      }
    }

    date = date || flatDate(); //default date is today

    //Get all members
    let members = [member];
    partners.forEach(partnerId => {
      let partner = mentions.members.find(user => user.id === partnerId);
      if (partner && !partner.user.bot) {
        members.push(new Member(partner));
      }
    });
    members = _uniq(members);

    try {
      await g.tallyWorkout({
        members,
        exercise,
        duration: `${time} ${timeUnit}`,
        date,
        logTime: formatDate(new Date(), "M-D-YY h:mm:ssa"), // may need current timezone?
        imageURL: image && image.url
      });
    } catch (error) {
      logResponse(
        message,
        `Oh crap, ${member}! I tried to log your workout but got this error. **${
          error.message
        }**.`
      );
      return;
    }

    logResponse(message, null, true);

    if (members.length > 1) {
      let logger = members.shift();
      members = members.map(member => member.toString());
      let eachOf = members.length > 1 ? "each of " : "";
      let end = members.splice(-2).join(" and ");
      let mentions = [...members, end].join(", ");

      channel
        .send(
          `Hey! ${mentions}! I've logged a workout for ${eachOf}you on behalf of ${logger}. Team work!`
        )
        .then(() => {})
        .catch(error => console.log(error));
    }

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
  let to = flatDate();
  let from = subDays(to, 8);
  let counts;

  try {
    counts = await g.getWorkoutCounts(from, to);
  } catch (error) {
    console.log("Failed to get weekley results");
    console.log(error);
    return;
  }

  let data = [];
  Object.keys(counts).forEach(id => {
    let row = counts[id];
    data.push([
      row.username,
      row.workoutsLogged,
      row.daysWorkedOut,
      row.yearTotal
    ]);
  });
  data.sort((a, b) => b[2] - a[2]);
  data.unshift(["Member", "Logged", "Days", "Year"]);

  let output = table(data, {
    columns: {
      0: { truncate: 13 }
    }
  });

  let message = `
Hey, Tranquili-nerds! I've prepared your summary for:

**The Week of ${formatDate(from, "MMM Do")}**

Take a look and make sure every workout you've done is accounted for.
If something seems off, be sure to get in touch with an admin.
We wouldn't want any of your hard work slipping through the cracks!

*Logged* - Total workouts logged this week.
*Days* - Total days worked out this week.
*Year* - Total days worked out this year`;

  let channel = getChannel("general");
  if (channel) {
    channel.send(message + "```" + output.toString() + "```");
  }
});

/**
 * First day of every month
 * I'm looking for workouts between (exclusive)
 * last Sunday and today (Monday)...
 * FROM: 8 days ago
 * TO: Today at 00:00;
 */
// const monthlyResult = schedule.scheduleJob("* 8 1 * *", async () => {
//   // TESTING
//   // const monthlyResult = schedule.scheduleJob("*/5 * * * * *", async () => {
//   console.log("getting MONTHLY results");
//   let to = flatDate();
//   let from = subDays(subMonths(to, 1), 1);
//   let counts;

//   try {
//     counts = await g.getWorkoutCounts(from, to);
//   } catch (error) {
//     console.log("Failed to get weekley results");
//     console.log(error);
//     return;
//   }

//   let table = new AsciiTable(`${formatDate(from, "MMMM YYYY")}`);
//   table.setHeading("Member", "Logged", "Days", "Year");

//   Object.keys(counts).forEach(id => {
//     let row = counts[id];
//     table.addRow(
//       row.username,
//       row.workoutsLogged,
//       row.daysWorkedOut,
//       row.yearTotal
//     );
//   });

//   let channel = getChannel("general");

//   let message = `
//   Hey, Tranquili-nerds! Here's your monthly workout summary.
//   **Logged** - Total workouts logged this month.
//   **Days** - Total days worked out this month.
//   **Year** - Total days worked out this year`;

//   if (channel) {
//     channel.send(message + "```" + table + "```");
//   }
// });
