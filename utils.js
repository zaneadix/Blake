const timeUnits = ["min", "mins", "minutes", "hr", "hrs", "hour", "hours"];

const MATCHERS = {
  LOG_FORMAT: /^(\w[\w\s]*)\s*for\s*((\d*)\s*?([a-z]+))(\s*on\s*((\d*)\/(\d*)(\/(\d*))?))?/i,
  IMAGE_EXTS: /\.(jpg?g|tiff|png)$/i,
  MINUTE: /min|mins|minutes/,
  HOUR: /hr|hrs|hour|hours/
};

const isLog = content => {
  return MATCHERS.LOG_FORMAT.test(content);
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

module.exports = {
  isLog,
  timeUnits,
  getLogValues,
  MATCHERS
};
