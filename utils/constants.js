const COLORS = {
  BLUE: {
    red: 0.082,
    green: 0.396,
    blue: 0.753
  },
  WHITE: {
    red: 0.961,
    green: 0.961,
    blue: 0.961
  }
};

const MATCHERS = {
  LOG_FORMAT: /^(\w[\w\s]*)\s*for\s*((\d*)\s*?([a-z]+))(\s*on\s*((\d*)\/(\d*)(\/(\d*))?))?/i,
  IMAGE_EXTS: /\.(jpg?g|tiff|png)$/i,
  MINUTE: /min|mins|minutes/,
  HOUR: /hr|hrs|hour|hours/
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

const TIME_UNITS = ["min", "mins", "minutes", "hr", "hrs", "hour", "hours"];

const makeColumns = keys => {
  let columns = {};
  keys.forEach((col, index) => {
    columns[col.toUpperCase()] = index;
  });
  return columns;
};
const TALLY_COLUMNS = makeColumns(["ID", "MEMBER", ...MONTHS, "TOTAL"]);
const LOG_COLUMNS = makeColumns([
  "ID",
  "MEMBER",
  "EXERCISE",
  "DURATION",
  "DATE",
  "PICTURE",
  "FIRST_OF_DAY",
  "LOG_TIME"
]);

const SUBMISSION_WINDOW = 7;

module.exports = {
  COLORS,
  LOG_COLUMNS,
  MONTHS,
  MATCHERS,
  SUBMISSION_WINDOW,
  TALLY_COLUMNS,
  TIME_UNITS
};
