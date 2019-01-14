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

/**
 * Order of Ops:
 * Pull out each set of optional fields while-style
 */

// const MINUTE_R = /minutes?|mins?/i;
// const HOUR_R = /hours?|hrs?/i;
// const V_DURATION_R = /^((\d+\.{1}\d+)|(\.?\d+))$/i;
// const ACTIVITY_R = /((['()/\\\w]*\s?)+)/i;
// const TIME_R = /(((\d.?)+)\s*?([a-z]+))/i; //need to validate number using DURATION
// const DATE_R = /(\s+on\s+((\d+)\/(\d+)(\/(\d+))?))/i;
// const PARTNERS_R = /(\s+with\s+(\s*(and\s)?<@!?\d+>\s*,?)+)/i;

// console.log(exercise);

const MATCHERS = {
  IMAGE_EXTS: /\.(jpe?g|tiff|png)$/i
  //           gym (weights/jogging)   for 30[.5] min               on 12/21[/18]                      with @jim[,] @dale [and] @bob
  // LOG_FORMAT: /(^\(?\w['()/\\\w\s]*)\s+for\s+(((\d.?)+)\s*?([a-z]+))(\s+on\s+((\d+)\/(\d+)(\/(\d+))?))?(\s+with\s+(\s*(and\s)?<@!?\d+>\s*,?)+)?/i,

  // ACTIVITY: ACTIVITY_R,
  // DATE: DATE_R,
  // HOUR: HOUR_R,
  // MINUTE: MINUTE_R,
  // PARTNERS: PARTNERS_R,
  // TIME: TIME_R,
  // V_DURATION: V_DURATION_R,

  // LOG: new RegExp(`^((${ACTIVITY_R.source}\\s+for\\s${TIME_R.source})|(${TIME_R.source}\\s+of\\s${ACTIVITY_R.source}))`),
  // LOG_OPTIONS: new RegExp(`(${DATE_R.source}|${PARTNERS_R.source})`, 'g'),
  // POSSIBLE_LOG: /(\d\.*)+\s*(mins?|minutes?|hrs?|hours?)(?=\s)?(?!.)/,
};

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

const TIME_UNITS = ['min', 'mins', 'minutes', 'hr', 'hrs', 'hour', 'hours'];

const makeColumns = keys => {
  let columns = {};
  keys.forEach((col, index) => {
    columns[col.toUpperCase()] = index;
  });
  return columns;
};
const TALLY_COLUMNS = makeColumns(['ID', 'MEMBER', ...MONTHS, 'TOTAL']);
const LOG_COLUMNS = makeColumns([
  'ID',
  'MEMBER',
  'EXERCISE',
  'DURATION',
  'DATE',
  'PICTURE',
  'FIRST_OF_DAY',
  'LOG_TIME'
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
