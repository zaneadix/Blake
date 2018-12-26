module.exports = data => {
  let sheets = {};
  (data.sheets || []).map(sheet => {
    sheets[sheet.properties.title] = sheet.properties.sheetId;
  });
  return {
    id: data.id || data.spreadsheetId,
    sheets
  };
};
