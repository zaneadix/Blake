const formatDate = require("date-fns/format");
const {
  StringValue,
  NumberValue,
  BooleanValue,
  FormulaValue,
  formatLogDate
} = require("./utils");

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
  month,
  user,
  exercise,
  duration,
  date,
  logTime,
  firstOfDay,
  imageURL
) => {
  // Find the row of the current user
  let monthNumber = parseInt(formatDate(date, "M"), 10);
  let tallyRequest;
  let tallyRow = 0;
  let requests = [];
  let userRow = tallyData.find(row => {
    tallyRow++;
    return row[0] === user.id;
  });

  // Tally only if this is the first workout of the day
  if (userRow && firstOfDay) {
    let column = monthNumber + 1; // add 1 to month number for userID and username offset
    let currentValue = userRow[column];
    requests.push(
      new UpdateCellRequest(
        workoutLog.sheets["Tally"],
        tallyRow - 1,
        column,
        new NumberValue(currentValue ? parseInt(currentValue, 10) + 1 : 1)
      )
    );
  }

  // Add row if it doesn't exists
  if (!userRow) {
    ++tallyRow;
    let rowData = [new StringValue(user.id), new StringValue(user.username)];
    for (let i = 0; i < 12; i++) {
      rowData.push(new NumberValue(i === monthNumber - 1 ? 1 : 0));
    }
    rowData.push(new FormulaValue(`=SUM(B${tallyRow}:M${tallyRow})`));
    requests.push(new AddRowRequest(workoutLog.sheets["Tally"], rowData));
  }

  requests.push(
    new AddRowRequest(workoutLog.sheets[month], [
      new StringValue(user.id),
      new StringValue(user.username),
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

  return {
    spreadsheetId: workoutLog.id,
    resource: { requests }
  };
};
