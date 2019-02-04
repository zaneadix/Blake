const subDays = require('date-fns/sub_days');
const addDays = require('date-fns/add_days');
const formatDate = require('date-fns/format');
const { table } = require('table');

const g = require('../google');
const { flatDate } = require('../utils');

const FROM = /\s+from\s+((\d+)\/(\d+)(\/(\d+))?)/i;
const TO = /\s+to\s+((\d+)\/(\d+)(\/(\d+))?)/i;
const OF = /\s+of\s+(<@!?(\d+)>)/i;
const ACTIVITY = new RegExp(
  `activity(${OF.source})?((${FROM.source})?(${TO.source})?)?`
);

const getActivityValues = message => {
  let [
    ,
    ,
    ,
    memberId,
    ,
    ,
    from,
    fMonth,
    fDay,
    ,
    ,
    ,
    to,
    tMonth,
    tDay
  ] = ACTIVITY.exec(message.content);

  console.log(memberId);

  let member =
    message.mentions.users.find(user => user.id === memberId) || message.author;
  let year = new Date().getFullYear();
  let toDate = to ? new Date(year, tMonth - 1, tDay) : flatDate();
  toDate = addDays(toDate, 1);
  let fromDate = from ? new Date(year, fMonth - 1, fDay) : subDays(toDate, 10);
  fromDate = subDays(fromDate, 1);

  return {
    member,
    year,
    fromDate,
    toDate
  };
};

const getActivity = async message => {
  let { member, year, fromDate, toDate } = getActivityValues(message);
  let fromPrint = formatDate(addDays(fromDate, 1), 'MMM Do');
  let toPrint = formatDate(toDate, 'MMM Do');

  let data;
  try {
    data = await g.getLogsInRange(member.id, fromDate, toDate);
  } catch (error) {
    console.log(error);
  }

  if (!data.length) {
    message.author.send(
      `I wasn't able to find any logged activity for **${member}** within the range of **${fromPrint}** to **${toPrint}**`
    );
    return;
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
    `from **${fromPrint}** to **${toPrint}**`,
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

    try {
      await message.author.send(response);
    } catch (error) {
      console.log(error);
    }
  }
};

module.exports = { getActivity };
