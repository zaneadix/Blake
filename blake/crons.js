const schedule = require('node-schedule');
const { table } = require('table');
const formatDate = require('date-fns/format');
const add = require('date-fns/add');
const sub = require('date-fns/sub');
const _chunk = require('lodash/chunk');

const g = require('../google');
const { flatDate } = require('../utils');
const GUILD_ID = process.env.TFC_GUILD;

const getChannel = async (client, channelName) => {
  let guild = await client.guilds.fetch(GUILD_ID);
  let channel;
  if (guild) {
    channel = guild.channels.cache.find(channel => channel.name === channelName);
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
   * "0 6 * * 1"
   *
   */

  // '*/5 * * * * *' to test
  const weekleyResult = schedule.scheduleJob('0 8 * * 1', async () => {
    let to = flatDate();
    let from = sub(to, { days: 8 });
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
      data.push([row.username, row.workoutsLogged, row.daysWorkedOut, row.yearTotal]);
    });
    data.sort((a, b) => b[2] - a[2]);

    let messages = _chunk(data, 10).map((chunk, index) => {
      if (index === 0) {
        chunk.unshift(['Member', 'Logged', 'Days', 'Year']);
      }

      let output = table(chunk, {
        columns: {
          0: { truncate: 15, width: 15 },
          1: { width: 6 },
          2: { width: 4 },
          3: { width: 4 },
        },
      });

      let message = '```' + output.toString() + '```';

      if (index === 0) {
        message = `Rise and shine, Tranquili-nerds! I've prepared your summary for:
**The Week of ${formatDate(add(from, { days: 1 }), 'MMM do')}**
Take a look and make sure every workout you've done is accounted for.
If something seems off, be sure to get in touch with an admin.
We wouldn't want any of your hard work slipping through the cracks!
  *Logged* - Total workouts logged this week.
  *Days* - Total days worked out this week.
  *Year* - Total days worked out this year
${message}`;
      }

      return message;
    });

    let channel = await getChannel(client, process.env.TFC_SUMMARY_CHANNEL_NAME);
    messages.forEach(message => {
      channel.send(message);
    });
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
