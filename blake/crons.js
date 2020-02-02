const schedule = require('node-schedule');
const { table } = require('table');
const formatDate = require('date-fns/format');
const addDays = require('date-fns/add_days');
const subDays = require('date-fns/sub_days');

const g = require('../google');
const { flatDate } = require('../utils');
const GUILD_ID = process.env.TFC_GUILD;

const getChannel = (client, channelName) => {
  let guild = client.guilds.get(GUILD_ID);
  let channel;
  if (guild) {
    channel = guild.channels.find(channel => channel.name === channelName);
  }
  return channel;
};

/**
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

const crons = client => {
  /**
   * Every Monday at 8am
   * I'm looking for workouts between (exclusive)
   * last Sunday and today (Monday)...
   * FROM: 8 days ago
   * TO: Today at 00:00;
   */
  const weekleyResult = schedule.scheduleJob("*/30 * * * * *", async () => {
    let to = flatDate();
    let from = subDays(to, 8);
    let counts;
    try {
      counts = await g.getActivityCountsInRange(from, to);
    } catch (error) {
      console.log('Failed to get weekley results');
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
    data.unshift(['Member', 'Logged', 'Days', 'Year']);
    let output = table(data, {
      columns: {
        0: { truncate: 13 }
      }
    });
    let message = `
  Rise and shine, Tranquili-nerds! I've prepared your summary for:
  **The Week of ${formatDate(addDays(from, 1), 'MMM Do')}**
  Take a look and make sure every workout you've done is accounted for.
  If something seems off, be sure to get in touch with an admin.
  We wouldn't want any of your hard work slipping through the cracks!
  *Logged* - Total workouts logged this week.
  *Days* - Total days worked out this week.
  *Year* - Total days worked out this year`;
    let channel = getChannel(client, 'home');
    if (channel) {
      channel.send(message + '```' + output.toString() + '```');
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
};

module.exports = crons;
