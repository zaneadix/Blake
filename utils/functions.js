const formatDate = require("date-fns/format");
const subMinutes = require("date-fns/sub_minutes");
const { MATCHERS } = require("./constants");
const tzOffset = new Date().getTimezoneOffset();

const currentTimeZone = date => {
  date = date || new Date();
  return subMinutes(date, tzOffset);
};

const formatLogDate = date => {
  return formatDate(date || Date.now(), "MMM D");
};

const getLogValues = content => {
  let [, e, , t, tU, , dt, m, dy, , y] = MATCHERS.LOG_FORMAT.exec(content);
  return {
    date: dt,
    day: dy,
    month: m,
    year: y ? `20${y}` : "2018",
    time: t,
    timeUnit: tU,
    exercise: e
  };
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
  isLog,
  formatLogDate,
  getLogValues,
  currentTimeZone,
  letterFromNumber
};
