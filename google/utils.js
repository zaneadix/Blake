const formatDate = require("date-fns/format");

const BLUE = {
  red: 0.082,
  green: 0.396,
  blue: 0.753
};

const WHITE = {
  red: 0.961,
  green: 0.961,
  blue: 0.961
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

const formatLogDate = date => {
  return formatDate(date || Date.now(), "MMM D");
};

//from 0;
const letterFromNumber = number => {
  let letter = String.fromCharCode(65 + number);
  return letter;
};

class StringValue {
  constructor(stringValue = "") {
    this.userEnteredValue = {
      stringValue
    };
  }
}

class NumberValue {
  constructor(numberValue = 0) {
    this.userEnteredValue = {
      numberValue
    };
  }
}

class BooleanValue {
  constructor(boolValue = true) {
    this.userEnteredValue = {
      boolValue
    };
  }
}

class FormulaValue {
  constructor(formulaValue = "") {
    this.userEnteredValue = {
      formulaValue
    };
  }
}

module.exports = {
  COLORS: {
    BLUE,
    WHITE
  },
  MONTHS,
  LOG_COLUMNS,
  TALLY_COLUMNS,
  StringValue,
  NumberValue,
  BooleanValue,
  FormulaValue,
  formatLogDate,
  letterFromNumber
};
