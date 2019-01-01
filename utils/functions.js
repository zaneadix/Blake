const formatDate = require("date-fns/format");
const { MATCHERS } = require("./constants");

const flatDate = date => {
  return new Date((date || new Date()).setHours(0, 0, 0, 0));
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
    year: y ? `20${y}` : "2019",
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
  flatDate,
  getLogValues,
  letterFromNumber
};
