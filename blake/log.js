let _uniq = require('lodash/uniq');
let formatDate = require('date-fns/format');
let dayIsAfter = require('date-fns/isAfter');
let { utcToZonedTime } = require('date-fns-tz');
let differenceInDays = require('date-fns/differenceInDays');

let client = require('./client');
let logger = require('../logger');
let g = require('../google');
let { getUserData } = require('../db');
let { flatDate, MATCHERS, REACTIONS, SUBMISSION_WINDOW, TIME_UNITS } = require('../utils');

let failMessageCache = {};

const MINUTE = /minutes?|mins?/i;
const HOUR = /hours?|hrs?/i;
const LOG = /^((['()/\\\w\s])+)\s+for\s+((\d+(\.\d+)?)\s*?(minutes?|mins?|hours?|hrs?))/i;
const LOG_OPTIONS = /(\s+on\s+((\d+)\/(\d+)(\/(\d+))?)|\s+with\s+(\s*(and\s)?<@!?\d+>\s*,?)+)/gi;
const POSSIBLE_LOG = /(\d\.*)+\s*(minutes?|mins?|hours?|hrs?)/i;

let parseLog = content => {
  let firstSentence = content.split(/\.(?!\d)/)[0] || '';
  firstSentence = firstSentence.replace(MATCHERS.COMMAND, '');
  return firstSentence;
};

let isLogMessage = message => {
  let log = parseLog(message.content);
  let isLog = log.includes('for') && LOG.test(log);

  if (!isLog) {
    let maybe = POSSIBLE_LOG.test(log);
    if (maybe) {
      message
        .reply(
          `I think you might have just tried to submit a log.
If so, please **edit your message**, following the guidelines below.
**Make sure your log comes first in your message.**
\`\`\`
Activity        Duration        Date           Partners
  [Ran]  for  [40 minutes]  { on [2/22] } { with [*mentions*] }

Examples:
Biked to work for 30 min
Cartwheels for 1 hr
Jumped up and down for 2 hours on 2/22
Punched bricks for 10 minutes with @ShaunT @TonyH @myCat
Ran in circles for 12 hrs on 1/1 with @mom, @sister and @dad
Gym (wights/cardio) for 1.5 hours
\`\`\``,
        )
        .then(response => {
          cacheResponse(message, response);
        })
        .catch(error => logger.error(error));
    }
  }

  return isLog;
};

const getLogValues = content => {
  let log = parseLog(content);
  let cutoff = log.length;
  let values = {
    year: new Date().getFullYear(),
    partnerIds: [],
  };
  let option;

  while ((option = LOG_OPTIONS.exec(log))) {
    let match = option[0].trim();
    cutoff = option.index < cutoff ? option.index : cutoff;
    switch (match.split(' ')[0]) {
      case 'on':
        values = Object.assign(values, {
          date: option[2],
          month: option[3],
          day: option[4],
          year: option[6] ? `20${option[6]}` : values.year,
        });
        break;
      case 'with':
        values.partnerIds = option[0].match(/\d+/g) || [];
    }
  }

  log = log.substring(0, cutoff).trim();

  let req = LOG.exec(log);
  let workout = req[1];
  let duration = req[4];
  let timeUnit = req[6];

  return Object.assign(values, {
    duration,
    timeUnit,
    workout,
  });
};

const cacheResponse = (message, response) => {
  failMessageCache[message.id] = failMessageCache[message.id] || {};
  failMessageCache[message.id][response.id] = response;
};

const clearResponses = message => {
  let responses = failMessageCache[message.id];
  if (responses) {
    Object.keys(responses).forEach(async responseId => {
      let response = responses[responseId];
      await response.delete();
      delete responses[responseId];
    });
    delete failMessageCache[message.id];
  }
};

const logResponse = async (message, feedback, success = false, cteCompliant = false) => {
  if (success) {
    let failReaction = message.reactions.cache.get(REACTIONS.FAILURE);
    failReaction && (await failReaction.remove(client.user));
  }

  message
    .react(success ? REACTIONS.SUCCESS : REACTIONS.FAILURE)
    .then(() => {
      if (success) {
        clearResponses(message);
      }
    })
    .catch(error => logger.error(error));

  if (success && cteCompliant) {
    message.react(message.guild.emojis.cache.get(process.env.TFC_CTE_COMPLIANT_EMOJI));
  }

  if (feedback) {
    message.channel
      .send(feedback)
      .then(response => {
        if (!success) {
          cacheResponse(message, response);
        }
      })
      .catch(error => logger.error(error));
  }
};

const logWorkout = async message => {
  let { attachments, author, channel, content, member, mentions } = message;
  let { date, day, month, year, duration, timeUnit, workout, partnerIds } = getLogValues(content);

  // temporary fix. Spotify embeds are causing messages to post twice.
  if (message.embeds.length) {
    return;
  }

  let userData = await getUserData(member.user);

  if (MINUTE.test(timeUnit)) {
    timeUnit = 'minute';
  } else if (HOUR.test(timeUnit)) {
    timeUnit = 'hour';
  } else {
    logResponse(
      message,
      `Sorry, ${
        member.user
      }! The time unit you entered (*${timeUnit}*) is not one I know. Make sure to use one of these: *${TIME_UNITS.join(
        ', ',
      )}*`,
    );
    return;
  }
  timeUnit = duration > 1 ? `${timeUnit}s` : timeUnit; //pluralize

  if (date) {
    if (!(month >= 1 && month <= 12)) {
      logResponse(
        message,
        `Quit goofin' off, ${member.user}! Month should be a number from 1 to 12. You entered *${month}*.`,
      );
      return;
    }

    if (!/\d{4}/.test(year)) {
      logResponse(message, `Quit goofin' off, ${member.user}! It's definitely not the year ${year}.`);
      return;
    }

    // Month without -1 puts it into next month
    // Day set to zero brings it back to last day of current month;
    let dayCount = new Date(year, month, 0).getDate();

    if (!(day >= 1 && day <= dayCount)) {
      logResponse(
        message,
        `Quit being silly, ${member.user}! Day should be a number between 1 and ${dayCount} for the month you gave. You entered *${day}*.`,
      );
      return;
    }

    date = new Date(year, month - 1, day);
    flat = flatDate(utcToZonedTime(new Date(), userData.timeZone));
    if (dayIsAfter(date, flat)) {
      logResponse(message, `Date alert, ${member.user}! The date you entered is in the future. Quit horsin' around!`);
      return;
    }

    if (differenceInDays(flat, date) > SUBMISSION_WINDOW) {
      logResponse(
        message,
        `Date alert, ${member.user}! The date you entered is outside the ${SUBMISSION_WINDOW} day window. Please contact an admin to have your workout logged manually.`,
      );
      return;
    }
  }

  date = date || utcToZonedTime(new Date(), userData.timeZone); //default date is today

  //Get all users
  let members = [member];
  partnerIds.forEach(partnerId => {
    let partner = mentions.members.find(member => member.id === partnerId);
    if (partner && !partner.bot) {
      members.push(partner);
    }
  });
  members = _uniq(members);

  let imageURL;
  let attachment = attachments.first();
  if (attachment && MATCHERS.IMAGE_EXTS.test(`.${attachment.name}`)) {
    imageURL = attachment.url;
  }

  try {
    await g.tallyWorkout({
      members,
      workout,
      duration: `${duration} ${timeUnit}`,
      date,
      logTime: formatDate(date, 'M-d-yy h:mm:ssa'), // may need current timezone?
      imageURL: imageURL,
    });
  } catch (error) {
    logResponse(
      message,
      `Oh crap, ${member.user}! I tried to log your workout but got this error. **${error.message}**.`,
    );
    return;
  }

  logResponse(message, null, true, !!imageURL);

  if (members.length > 1) {
    let logger = members.shift();
    members = members.map(members => members.user.toString());
    let eachOf = members.length > 1 ? 'each of ' : '';
    let end = members.splice(-2).join(' and ');
    let mentions = [...members, end].join(', ');

    channel
      .send(`Hey! ${mentions}! I've logged activty for ${eachOf}you on behalf of ${logger}. Team work!`)
      .then(() => {})
      .catch(error => logger.error(error));
  }

  return;
};

module.exports = {
  isLogMessage,
  logWorkout,
};
