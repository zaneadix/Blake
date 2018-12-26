const { COLORS, MONTHS } = require("./utils");

const buildHeader = (
  sheetId,
  start,
  end,
  columnWidths,
  freezeColumn = false
) => {
  return [
    ...columnWidths.map(group => {
      return {
        updateDimensionProperties: {
          range: {
            sheetId,
            dimension: "COLUMNS",
            startIndex: group.start,
            endIndex: group.end
          },
          properties: {
            pixelSize: group.width
          },
          fields: "pixelSize"
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
            frozenColumnCount: freezeColumn ? 1 : 0
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
      1,
      14,
      [{ start: 1, end: 14, width: 80 }],
      true
    )
  ];
  MONTHS.map(month => {
    requests = [
      ...requests,
      ...buildHeader(workoutLog.sheets[month], 0, 4, [
        { start: 0, end: 3, width: 100 },
        { start: 3, end: 4, width: 400 }
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
