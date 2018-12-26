const { MONTHS, StringValue } = require("./utils");

class TallySheet {
  constructor() {
    this.properties = {
      title: "Tally"
    };
    this.data = [
      {
        rowData: [
          {
            values: [
              new StringValue(""),
              ...MONTHS.map(month => new StringValue(month)),
              new StringValue("Total")
            ]
          }
        ]
      }
    ];
  }
}

class LogSheet {
  constructor(title) {
    this.properties = {
      title: title
    };
    this.data = [
      {
        rowData: [
          {
            values: [
              new StringValue("Name"),
              new StringValue("Date"),
              new StringValue("Duration"),
              new StringValue("Exercise")
            ]
          }
        ]
      }
    ];
  }
}

module.exports = logName => {
  return {
    properties: {
      title: logName
    },
    sheets: [new TallySheet(), ...MONTHS.map(month => new LogSheet(month))]
  };
};
