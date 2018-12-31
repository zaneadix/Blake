const { COLORS, MONTHS, LOG_COLUMNS, TALLY_COLUMNS } = require("../utils");

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
        {
          start: TALLY_COLUMNS.ID,
          end: TALLY_COLUMNS.ID + 1,
          width: 0,
          hidden: true
        },
        {
          start: TALLY_COLUMNS.MEMBER,
          end: TALLY_COLUMNS.MEMBER + 1,
          width: 100
        },
        { start: TALLY_COLUMNS.JAN, end: TALLY_COLUMNS.TOTAL + 1, width: 80 }
      ],
      2 //frozen columns
    )
  ];
  MONTHS.map(month => {
    requests = [
      ...requests,
      ...buildHeader(workoutLog.sheets[month], 0, 8, [
        {
          start: LOG_COLUMNS.ID,
          end: LOG_COLUMNS.ID + 1,
          width: 0,
          hidden: true
        },
        { start: LOG_COLUMNS.MEMBER, end: LOG_COLUMNS.MEMBER + 1, width: 120 },
        {
          start: LOG_COLUMNS.EXERCISE,
          end: LOG_COLUMNS.EXERCISE + 1,
          width: 250
        },
        {
          start: LOG_COLUMNS.DURATION,
          end: LOG_COLUMNS.FIRST_OF_DAY,
          width: 120
        },
        {
          start: LOG_COLUMNS.FIRST_OF_DAY,
          end: LOG_COLUMNS.LOG_TIME + 1,
          width: 140
        }
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
