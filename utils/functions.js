const formatDate = require("date-fns/format");
const { utcToZonedTime } = require("date-fns-tz");
const { MATCHERS } = require("./constants");

const adjustedNow = timeZone => {
  console.log(timeZone);

  let local = utcToZonedTime(Date.now(), timeZone);
  console.log(local.toString());

  // let locale = now.toLocaleString("en-US", {
  //   timeZone
  // });
  // console.log(locale);

  // let adjustedDate = new Date(locale);
  // console.log(adjustedDate);

  return local;
};

const flatDate = date => {
  return new Date((date || new Date()).setHours(0, 0, 0, 0));
};

const formatLogDate = date => {
  return formatDate(date || Date.now(), "MMM d");
};

const isLog = content => {
  return MATCHERS.LOG_FORMAT.test(content);
};

//from 0;
const letterFromNumber = number => {
  let letter = String.fromCharCode(65 + number);
  return letter;
};

module.exports = {
  adjustedNow,
  isLog,
  formatLogDate,
  flatDate,
  letterFromNumber
};
