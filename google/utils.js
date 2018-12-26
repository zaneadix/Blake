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

class StringValue {
  constructor(stringValue) {
    this.userEnteredValue = {
      stringValue
    };
  }
}

class NumberValue {
  constructor(numberValue) {
    this.userEnteredValue = {
      numberValue
    };
  }
}

class FormulaValue {
  constructor(formulaValue) {
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
  StringValue,
  NumberValue,
  FormulaValue
};
