class Member {
  constructor(member) {
    this.member = member;
    this.user = member.user;

    this.id = member.user.id;
    this.nickname = member.nickname;
    this.username = member.user.username;
  }

  getName() {
    return this.nickname || this.username;
  }

  toString() {
    return this.member.user.toString();
  }
}

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
  Member,
  BooleanValue,
  FormulaValue,
  NumberValue,
  StringValue
};
