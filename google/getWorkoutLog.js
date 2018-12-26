const templateWorkoutLog = require("./templateWorkoutLog");
const templateLogSheets = require("./templateLogSheets");
const serializeWorkoutLog = require("./serializeWorkoutLog");

module.exports = async ({ drive, sheets, cache }, directoryID, year) => {
  let logName = `${year} Workout Log`;
  let spreadsheetId;
  let workoutLog = cache[logName];

  let reciever = ({ data }) => {
    workoutLog = serializeWorkoutLog(data);
    cache[logName] = workoutLog;
  };

  if (!workoutLog) {
    // Try to fetch the log file
    await drive.files
      .list({
        q: `name = "${logName}" and "${directoryID}" in parents and trashed = false`
      })
      .then(({ data }) => {
        spreadsheetId = data.files[0] ? data.files[0].id : spreadsheetId;
        if (spreadsheetId) {
          console.log("Successfully FETCHED log file", logName);
        }
      })
      .catch(error => console.log(error));
  } else {
    console.log("GOT LOG FROM CACHE");
  }

  if (spreadsheetId) {
    // Fetch sheet IDs
    await sheets.spreadsheets
      .get({ spreadsheetId })
      .then(reciever)
      .catch(error => console.log(error));
  }

  if (!workoutLog) {
    // Create the log file
    await sheets.spreadsheets
      .create({ resource: templateWorkoutLog(logName) })
      .then(reciever)
      .catch(error => console.log(error));

    if (workoutLog) {
      //Apply Formatting
      await sheets.spreadsheets
        .batchUpdate(templateLogSheets(workoutLog))
        .then(() => {})
        .catch(error => console.log(error));

      // Move file into TFC directory
      await drive.files
        .update({
          fileId: workoutLog.id,
          addParents: [directoryID]
        })
        .then(() => {})
        .catch(error => console.log(error));
    }
  }

  return workoutLog;
};
