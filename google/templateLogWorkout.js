const {
  StringValue,
  FormulaValue,
  formatLogDate,
  letterFromNumber,
  MONTHS,
  LOG_COLUMNS,
  TALLY_COLUMNS
} = require("../utils");

class AddRowRequest {
  constructor(sheetId, values) {
    this.appendCells = {
      sheetId,
      fields: "*",
      rows: [
        {
          values
        }
      ]
    };
  }
}

class UpdateCellRequest {
  constructor(sheetId, rowIndex, columnIndex, value) {
    this.updateCells = {
      fields: "*",
      range: {
        sheetId,
        startRowIndex: rowIndex,
        endRowIndex: rowIndex + 1,
        startColumnIndex: columnIndex,
        endColumnIndex: columnIndex + 1
      },
      rows: [
        {
          values: [[value]]
        }
      ]
    };
  }
}

module.exports = (
  workoutLog,
  tallyData,
  logData,
  month,
  members,
  exercise,
  duration,
  date,
  logTime,
  imageURL
) => {
  // Find the row of the current user

  let requests = [];
  let addRowCount = 0;
  members.forEach((member, index) => {
    let firstOfDay = !logData.find(row => {
      return (
        row[LOG_COLUMNS.ID] === member.id &&
        row[LOG_COLUMNS.DATE] === formatLogDate(date)
      );
    });

    let rowIndex = -1;
    let memberRow = tallyData.find(row => {
      rowIndex++;
      return row[TALLY_COLUMNS.ID] === member.id;
    });

    if (memberRow && memberRow[TALLY_COLUMNS.MEMBER] !== member.username) {
      requests.push(
        new UpdateCellRequest(
          workoutLog.sheets["Tally"],
          rowIndex,
          TALLY_COLUMNS.MEMBER,
          new StringValue(member.username)
        )
      );
    }

    if (!memberRow) {
      let tallyRow = rowIndex + 2 + addRowCount++;
      let rowData = [
        new StringValue(member.id),
        new StringValue(member.username)
      ];

      // Create formula to tally from associated month sheet
      let tallyId = letterFromNumber(TALLY_COLUMNS.ID);
      let logId = letterFromNumber(LOG_COLUMNS.ID);
      let logFirst = letterFromNumber(LOG_COLUMNS.FIRST_OF_DAY);
      MONTHS.forEach(month => {
        rowData.push(
          new FormulaValue(
            `=COUNTIFS(${month}!${logId}:${logId}, ${tallyId}${tallyRow}, ${month}!${logFirst}:${logFirst}, "yes")`
          )
        );
      });

      let col1 = letterFromNumber(TALLY_COLUMNS.JAN);
      let col2 = letterFromNumber(TALLY_COLUMNS.DEC);
      rowData.push(
        new FormulaValue(`=SUM(${col1}${tallyRow}:${col2}${tallyRow})`)
      );

      requests.push(new AddRowRequest(workoutLog.sheets["Tally"], rowData));
    }

    requests.push(
      new AddRowRequest(workoutLog.sheets[month], [
        new StringValue(member.id),
        new StringValue(member.username),
        new StringValue(exercise),
        new StringValue(duration),
        new StringValue(formatLogDate(date)),
        imageURL
          ? new FormulaValue(`=HYPERLINK("${imageURL}", "Hover To View")`)
          : new StringValue(""),
        new StringValue(firstOfDay ? "yes" : "no"),
        new StringValue(logTime)
      ])
    );
  });

  // let memberRow = tallyData.find(row => {
  //   rowIndex++;
  //   return row[TALLY_COLUMNS.ID] === member.id;
  // });

  // if (memberRow && memberRow[TALLY_COLUMNS.MEMBER] !== member.username) {
  //   requests.push(
  //     new UpdateCellRequest(
  //       workoutLog.sheets["Tally"],
  //       rowIndex,
  //       TALLY_COLUMNS.MEMBER,
  //       new StringValue(member.username)
  //     )
  //   );
  // }

  // Add row if it doesn't exists
  // if (!memberRow) {
  //   let tallyRow = rowIndex + 2;
  //   let rowData = [
  //     new StringValue(member.id),
  //     new StringValue(member.username)
  //   ];

  //   // Create formula to tally from associated month sheet
  //   let tallyId = letterFromNumber(TALLY_COLUMNS.ID);
  //   let logId = letterFromNumber(LOG_COLUMNS.ID);
  //   let logFirst = letterFromNumber(LOG_COLUMNS.FIRST_OF_DAY);
  //   MONTHS.forEach(month => {
  //     rowData.push(
  //       new FormulaValue(
  //         `=COUNTIFS(${month}!${logId}:${logId}, ${tallyId}${tallyRow}, ${month}!${logFirst}:${logFirst}, "yes")`
  //       )
  //     );
  //   });

  //   let col1 = letterFromNumber(TALLY_COLUMNS.JAN);
  //   let col2 = letterFromNumber(TALLY_COLUMNS.DEC);
  //   rowData.push(
  //     new FormulaValue(`=SUM(${col1}${tallyRow}:${col2}${tallyRow})`)
  //   );

  //   requests.push(new AddRowRequest(workoutLog.sheets["Tally"], rowData));
  // }

  // requests.push(
  //   new AddRowRequest(workoutLog.sheets[month], [
  //     new StringValue(member.id),
  //     new StringValue(member.username),
  //     new StringValue(exercise),
  //     new StringValue(duration),
  //     new StringValue(formatLogDate(date)),
  //     imageURL
  //       ? new FormulaValue(`=HYPERLINK("${imageURL}", "Hover To View")`)
  //       : new StringValue(""),
  //     new StringValue(firstOfDay ? "yes" : "no"),
  //     new StringValue(logTime)
  //   ])
  // );

  return {
    spreadsheetId: workoutLog.id,
    resource: { requests }
  };
};
