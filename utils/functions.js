const formatDate = require("date-fns/format");
const { MATCHERS } = require("./constants");

const flatDate = date => {
  return new Date((date || new Date()).setHours(0, 0, 0, 0));
};

const formatLogDate = date => {
  return formatDate(date || Date.now(), "MMM D");
};

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
