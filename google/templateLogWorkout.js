const formatDate = require("date-fns/format");
const { StringValue, NumberValue, FormulaValue } = require("./utils");

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
  userName,
  exercise,
  duration,
  date
) => {
  // Find the row of the current user
  let monthNumber = parseInt(formatDate(date, "M"), 10);
  let tallyRequest;
  let tallyRow = 0;
  let userRow = tallyData.find(row => {
    tallyRow++;
    return row[0] === userName;
  });

  console.log("Row is", tallyRow);

  if (userRow) {
    let currentValue = userRow[monthNumber];
    tallyRequest = new UpdateCellRequest(
      workoutLog.sheets["Tally"],
      tallyRow - 1,
      monthNumber,
      new NumberValue(currentValue ? parseInt(currentValue, 10) + 1 : 1)
    );
  } else {
    ++tallyRow;
    let rowData = [new StringValue(userName)];
    for (let i = 0; i < 12; i++) {
      rowData.push(new NumberValue(i === monthNumber - 1 ? 1 : 0));
    }
    rowData.push(new FormulaValue(`=SUM(B${tallyRow}:M${tallyRow})`));
    tallyRequest = new AddRowRequest(workoutLog.sheets["Tally"], rowData);
  }

  return {
    spreadsheetId: workoutLog.id,
    resource: {
      requests: [
        tallyRequest,
        new AddRowRequest(workoutLog.sheets[month], [
          new StringValue(userName),
          new StringValue(formatDate(date || Date.now(), "MMM D")),
          new StringValue(duration),
          new StringValue(exercise)
        ])
      ]
    }
  };
};
