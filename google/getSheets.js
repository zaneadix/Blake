const getSheets = async ({ drive, sheets, cache }, parentID, year, month) => {
  let tallyName = `Tally ${year}`;
  let logName = `${month} ${year}`;
  let tallySheet = cache[tallyName];
  let logSheet = cache[logName];

  // ABSTRACT
  if (!tallySheet || !logSheet) {
    console.log("FETCHING SHEETS");
    let q = `"${parentID}" in parents and trashed = false`;
    await drive.files
      .list({ q })
      .then(({ data }) => {
        //lol
        tallySheet = data.files.find(file => file.name === tallyName);
        tallySheet = tallySheet ? tallySheet.id : tallySheet;
        logSheet = data.files.find(file => file.name === logName);
        logSheet = logSheet ? logSheet.id : logSheet;
      })
      .catch(error => console.log(error));
  }

  if (!tallySheet) {
    let resource = {
      name: tallyName,
      parents: [parentID],
      mimeType: "application/vnd.google-apps.spreadsheet"
    };
    await drive.files
      .create({ resource, fields: "id" })
      .then(({ data }) => {
        tallySheet = data.id;
      })
      .catch(error => console.log(error));

    if (tallySheet) {
      await sheets.spreadsheets.values
        .append({
          spreadsheetId: tallySheet,
          range: "A1",
          valueInputOption: "USER_ENTERED",
          resource: {
            values: [
              [
                "",
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
                "Total"
              ]
            ]
          }
        })
        .then(response => {
          console.log("response");
        })
        .catch(error => console.log(error));
    }
  }

  if (!logSheet) {
    let resource = {
      name: logName,
      parents: [parentID],
      mimeType: "application/vnd.google-apps.spreadsheet"
    };
    await drive.files
      .create({ resource, fields: "id" })
      .then(({ data }) => {
        logSheet = data.id;
      })
      .catch(error => console.log(error));

    if (logSheet) {
      await sheets.spreadsheets.values
        .append({
          spreadsheetId: logSheet,
          range: "A1",
          valueInputOption: "USER_ENTERED",
          resource: { values: [["Name", "Date", "Duration", "Exercise"]] }
        })
        .then(response => {
          console.log("response");
        })
        .catch(error => console.log(error));
    }
  }

  tallySheet && (cache[tallyName] = tallySheet);
  logSheet && (cache[logName] = logSheet);

  return {
    tallySheet,
    logSheet
  };
};

module.exports = getSheets;
