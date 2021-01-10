const COLORS = {
  BLUE: {
    red: 0.082,
    green: 0.396,
    blue: 0.753,
  },
  WHITE: {
    red: 0.961,
    green: 0.961,
    blue: 0.961,
  },
};

const MATCHERS = {
  COMMANDS: /<@!?\d+>\s+([a-z]+)/i,
  IMAGE_EXTS: /\.(jpe?g|tiff|png)$/i,
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const REACTIONS = {
  SUCCESS: '✅',
  FAILURE: '❌',
};

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
  'LOG_TIME',
]);

const SUBMISSION_WINDOW = 7;

module.exports = {
  COLORS,
  LOG_COLUMNS,
  MONTHS,
  MATCHERS,
  REACTIONS,
  SUBMISSION_WINDOW,
  TALLY_COLUMNS,
  TIME_UNITS,
};
