const subDays = require('date-fns/sub_days');
const addDays = require('date-fns/add_days');
const formatDate = require('date-fns/format');
const { table } = require('table');

const g = require('../google');
const { flatDate } = require('../utils');

const FROM = /\s+from\s+((\d+)\/(\d+)(\/(\d+))?)/i;
const TO = /\s+to\s+((\d+)\/(\d+)(\/(\d+))?)/i;
const ACTIVITY = new RegExp(`activity((${FROM.source})?(${TO.source})?)?`);

const getDates = message => {
  let [, , , from, fMonth, fDay, , , , to, tMonth, tDay] = ACTIVITY.exec(
    message.content
  );

  let year = new Date().getFullYear();
  let toDate = to ? new Date(year, tMonth - 1, tDay) : flatDate();
  toDate = addDays(toDate, 1);
  let fromDate = from ? new Date(year, fMonth - 1, fDay) : subDays(toDate, 10);
  fromDate = subDays(fromDate, 1);

  return {
    year,
    fromDate,
    toDate
  };
};

const getActivity = async message => {
  let { year, fromDate, toDate } = getDates(message);

  let data;
  try {
    data = await g.getLogsInRange(message.author, fromDate, toDate);
  } catch (error) {
    throw error;
  }
  data = data.map(log => {
    return [
      log.activity,
      log.duration.replace(/ minutes?/, 'm').replace(/ hours?/, 'h'),
      formatDate(new Date(log.date).setFullYear(year), 'M/D'),
      log.firstOfDay
    ];
  });

  let description = [
    "Here's **your** summary of activity",
    `from **${formatDate(addDays(fromDate, 1), 'MMM Do')}** to **${formatDate(
      toDate,
      'MMM Do'
    )}**`,
    '\xa0\xa0\xa0_Activity_ - The completed activity',
    '\xa0\xa0\xa0_Dur_(ation) - Time spent active',
    '\xa0\xa0\xa0_Date_ - Date active',
    '\xa0\xa0\xa0_FOD_ - Is first activity of day (tallied)'
  ].join('\n');

  let tableChunks = [];
  while (data.length) {
    tableChunks.push(data.splice(0, 15));
  }

  for (let i = 0; i < tableChunks.length; i++) {
    let chunk = tableChunks[i];
    if (i === 0) {
      chunk.unshift(['Activity', 'Dur', 'Date', 'FOD']);
    }

    let tableConfig = {
      columns: {
        0: { truncate: 19, width: 19 },
        2: { truncate: 5, width: 5 },
        3: { truncate: 3, width: 3 }
      }
    };

    if (i !== tableChunks.length - 1) {
      tableConfig.border = tableConfig.border || {};
      Object.assign(tableConfig.border, {
        bottomBody: `-`
      });
    }

    if (i !== 0) {
      tableConfig.border = tableConfig.border || {};
      Object.assign(tableConfig.border, {
        topBody: `-`
      });
    }

    let output = table(chunk, tableConfig);
    let response = i === 0 ? description : '';
    response = response.concat('```' + output.toString() + '```');

    await message.author.send(response);
  }
};

module.exports = { getActivity };
