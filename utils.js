const logFormat = /^(\w[\w\s]*)\s*for\s*((\d*)\s*?([a-z]+))(\s*on\s*((\d{1,2})\/(\d{1,2})(\/(\d{2}))?))?/i;
const imageExts = /\.(jpg?g|tiff|png)$/i;
const timeUnits = ["min", "mins", "minutes", "hr", "hrs", "hour", "hours"];

const isLog = content => {
  return logFormat.test(content);
};

const getLogValues = content => {
  let [, e, , t, tU, , dt, m, dy, , y] = logFormat.exec(content);
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

module.exports = {
  isLog,
  imageExts,
  timeUnits,
  getLogValues
};
