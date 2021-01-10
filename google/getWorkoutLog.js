const templateWorkoutLog = require('./templateWorkoutLog');
const templateLogSheets = require('./templateLogSheets');
const serializeWorkoutLog = require('./serializeWorkoutLog');

const owner = process.env.TFC_OWNER;

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
    try {
      await drive.files
        .list({
          q: `name = "${logName}" and "${directoryID}" in parents and trashed = false`,
        })
        .then(({ data }) => {
          spreadsheetId = data.files[0] ? data.files[0].id : spreadsheetId;
        });
    } catch (error) {
      console.log(error);
      throw new Error('Failed to retrieve directory files');
    }
  }

  if (spreadsheetId) {
    try {
      await sheets.spreadsheets.get({ spreadsheetId }).then(reciever);
    } catch (error) {
      console.log(error);
      throw new Error('Failed to get spreadsheet');
    }
  }

  if (!workoutLog) {
    // Create spreadsheet
    try {
      await sheets.spreadsheets.create({ resource: templateWorkoutLog(logName) }).then(reciever);
    } catch (error) {
      console.log(error);
      throw new Error('Failed to create spreadsheet');
    }

    // Apply Formatting
    try {
      await sheets.spreadsheets.batchUpdate(templateLogSheets(workoutLog)).then(() => {});
    } catch (error) {
      console.log(error);
      throw new Error('Failed to apply formatting to spreadsheet');
    }

    // Move file into TFC directory
    try {
      await drive.files
        .update({
          fileId: workoutLog.id,
          addParents: [directoryID],
        })
        .then(() => {});
    } catch (error) {
      console.log(error);
      throw new Error('Failed to move spreadsheet into directory');
    }

    // Transfer ownership of file to TFC owner
    try {
      await drive.permissions
        .create({
          fileId: workoutLog.id,
          transferOwnership: true,
          resource: {
            type: 'user',
            role: 'owner',
            emailAddress: owner,
            transferOwnership: true,
          },
        })
        .then(() => {});
    } catch (error) {
      console.log(error);
      throw new Error('Failed to move spreadsheet into directory');
    }
  }

  return workoutLog;
};
