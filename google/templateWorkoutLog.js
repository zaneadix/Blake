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
              new StringValue("ID"),
              new StringValue("Member"),
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
              new StringValue("ID"),
              new StringValue("Member"),
              new StringValue("Exercise"),
              new StringValue("Duration"),
              new StringValue("Date"),
              new StringValue("Picture"),
              new StringValue("First of Day"),
              new StringValue("Log Time")
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
