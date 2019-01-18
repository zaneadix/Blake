const _uniq = require('lodash/uniq');
const formatDate = require('date-fns/format');
const dayIsAfter = require('date-fns/is_after');
const differenceInDays = require('date-fns/difference_in_days');

const client = require('./client');
const g = require('../google');
const {
  flatDate,
  Member,
  MATCHERS,
  REACTIONS,
  SUBMISSION_WINDOW,
  TIME_UNITS
} = require('../utils');

const failMessageCache = {};

const MINUTE = /minutes?|mins?/i;
const HOUR = /hours?|hrs?/i;
const DATE_V = /^((\d+\.{1}\d+)|(\.?\d+))$/i;
const WORKOUT = /((['()/\\\w]+\s?)+)/i;
const TIME = /(((\d.?)+)\s*?([a-z]+))/i; //need to validate number using DURATION
const DATE = /\s+on\s+((\d+)\/(\d+)(\/(\d+))?)/i;
const PARTNERS = /\s+with\s+(\s*(and\s)?<@!?\d+>\s*,?)+/i;

const LOG = new RegExp(
  `^((${WORKOUT.source}\\s+for\\s+${TIME.source})|(<@!?\\d+>\\s+log\\s+${
    TIME.source
  }\\s+of\\s+${WORKOUT.source}))`
);
const LOG_OPTIONS = new RegExp(`(${DATE.source}|${PARTNERS.source})`, 'ig');
const POSSIBLE_LOG = /(\d\.*)+\s*(mins?|minutes?|hrs?|hours?)(?=\s)?(?!.)/i;

const isLogMessage = content => {
  let result = LOG.test(content);
  if (!result) {
    result = POSSIBLE_LOG.test(content) ? 'maybe' : 'no';
  } else {
    result = 'yes';
  }
  return result;
};

const getLogValues = log => {
  let cutoff = log.length;
  let values = {
    year: new Date().getFullYear(),
    partners: []
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
          year: option[6] ? `20${option[6]}` : values.year
        });
        break;
      case 'with':
        values.partners = option[0].match(/\d+/g) || [];
    }
  }

  log = log.substring(0, cutoff).trim();

  let workout, duration, timeUnit;
  let req = LOG.exec(log);
  if (log.includes(' for ')) {
    workout = req[3];
    duration = req[6];
    timeUnit = req[8];
  } else if (log.includes(' of ')) {
    workout = req[14];
    duration = req[11];
    timeUnit = req[13];
  }

  return Object.assign(values, {
    duration,
    timeUnit,
    workout
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

const logResponse = async (message, feedback, success = false) => {
  if (success) {
    let failReaction = message.reactions.get(REACTIONS.FAILURE);
    failReaction && (await failReaction.remove(client.user));
  }

  message
    .react(success ? REACTIONS.SUCCESS : REACTIONS.FAILURE)
    .then(() => {
      if (success) {
        clearResponses(message);
      }
    })
    .catch(error => console.log(error));

  if (feedback) {
    message.channel
      .send(feedback)
      .then(response => {
        if (!success) {
          cacheResponse(message, response);
        }
      })
      .catch(error => console.log(error));
  }
};

const logWorkout = async message => {
  //Verify this is a log message
  switch (isLogMessage(message.content)) {
    case 'no':
      console.log('NO');
      return;
    case 'maybe':
      message
        .reply(
          'I think you might have just tried to submit a log. If so, please retry using the following format. fart fart fart fart'
        )
        .then(response => {
          cacheResponse(message, response);
        })
        .catch(error => console.log(error));
      return;
    case 'yes':
    default:
      break;
  }

  let { attachments, channel, content, member, mentions } = message;
  let {
    date,
    day,
    month,
    year,
    duration,
    timeUnit,
    workout,
    partners
  } = getLogValues(content);

  member = new Member(member);

  if (MINUTE.test(timeUnit)) {
    timeUnit = 'minute';
  } else if (HOUR.test(timeUnit)) {
    timeUnit = 'hour';
  } else {
    logResponse(
      message,
      `Sorry, ${member}! The time unit you entered (*${timeUnit}*) is not one I know. Make sure to use one of these: *${TIME_UNITS.join(
        ', '
      )}*`
    );
    return;
  }
  timeUnit = duration > 1 ? `${timeUnit}s` : timeUnit; //pluralize

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

  let image;
  if (attachments.size) {
    let attachment = attachments.values().next().value;
    image =
      attachment.filename && MATCHERS.IMAGE_EXTS.test(`.${attachment.filename}`)
        ? attachment
        : image;
  }

  try {
    await g.tallyWorkout({
      members,
      workout,
      duration: `${duration} ${timeUnit}`,
      date,
      logTime: formatDate(new Date(), 'M-D-YY h:mm:ssa'), // may need current timezone?
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
    let eachOf = members.length > 1 ? 'each of ' : '';
    let end = members.splice(-2).join(' and ');
    let mentions = [...members, end].join(', ');

    channel
      .send(
        `Hey! ${mentions}! I've logged workout for ${eachOf}you on behalf of ${logger}. Team work!`
      )
      .then(() => {})
      .catch(error => console.log(error));
  }

  return;
};

module.exports = {
  isLogMessage,
  logWorkout
};
