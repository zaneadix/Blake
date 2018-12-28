const { COLORS, MONTHS } = require("./utils");

const buildHeader = (sheetId, start, end, columnWidths, frozenColumns) => {
  return [
    ...columnWidths.map(group => {
      let properties = {};
      let fields = "";
      if (group.hidden) {
        properties.hiddenByUser = true;
        fields = "hiddenByUser";
      } else {
        properties.pixelSize = group.width;
        fields = "pixelSize";
      }

      return {
        updateDimensionProperties: {
          range: {
            sheetId,
            dimension: "COLUMNS",
            startIndex: group.start,
            endIndex: group.end
          },
          properties,
          fields
        }
      };
    }),
    // Format Header
    {
      repeatCell: {
        fields:
          "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)",
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: start,
          endColumnIndex: end
        },
        cell: {
          userEnteredFormat: {
            horizontalAlignment: "CENTER",
            backgroundColor: COLORS.BLUE,
            textFormat: {
              foregroundColor: COLORS.WHITE,
              fontSize: 10,
              bold: true
            }
          }
        }
      }
    },
    // Freeze Header and First Column
    {
      updateSheetProperties: {
        properties: {
          sheetId,
          gridProperties: {
            frozenRowCount: 1,
            frozenColumnCount: frozenColumns
          }
        },
        fields:
          "gridProperties.frozenRowCount, gridProperties.frozenColumnCount"
      }
    }
  ];
};

module.exports = workoutLog => {
  let requests = [
    ...buildHeader(
      workoutLog.sheets["Tally"],
      0,
      15,
      [
        { start: 0, end: 1, width: 0, hidden: true },
        { start: 1, end: 2, width: 100 },
        { start: 2, end: 15, width: 80 }
      ],
      2 //frozen columns
    )
  ];
  MONTHS.map(month => {
    requests = [
      ...requests,
      ...buildHeader(workoutLog.sheets[month], 0, 8, [
        { start: 0, end: 1, width: 0, hidden: true }, // ID
        { start: 1, end: 2, width: 100 }, // member
        { start: 2, end: 3, width: 250 }, // exercise
        { start: 3, end: 7, width: 120 }, // duration, date, picture, first of day
        { start: 7, end: 8, width: 140 } // log time
      ])
    ];
  });
  return {
    spreadsheetId: workoutLog.id,
    resource: {
      requests
    }
  };
};
