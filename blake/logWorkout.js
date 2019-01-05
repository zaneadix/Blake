const _uniq = require("lodash/uniq");
const formatDate = require("date-fns/format");
const dayIsAfter = require("date-fns/is_after");
const differenceInDays = require("date-fns/difference_in_days");

const g = require("../google");
const {
  flatDate,
  Member,
  MATCHERS,
  SUBMISSION_WINDOW,
  TIME_UNITS
} = require("../utils");

const getLogValues = content => {
  let [, e, , t, , tU, , dt, m, dy, , y, p] = MATCHERS.LOG_FORMAT.exec(
    content.trim()
  );
  let partners = (p || "").match(/\d+/g) || [];

  return {
    date: dt,
    day: dy,
    month: m,
    year: y ? `20${y}` : new Date().getFullYear(),
    time: t,
    timeUnit: tU,
    exercise: e,
    partners
  };
};

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

const logWorkout = async message => {
  let { attachments, channel, content, member, mentions } = message;
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

  member = new Member(member);

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
};

module.exports = logWorkout;
