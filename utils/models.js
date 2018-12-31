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
  BooleanValue,
  FormulaValue,
  NumberValue,
  StringValue
};
