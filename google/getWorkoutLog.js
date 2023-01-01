const templateWorkoutLog = require('./templateWorkoutLog');
const templateLogSheets = require('./templateLogSheets');
const serializeWorkoutLog = require('./serializeWorkoutLog');

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

    // Give anyone with link view permission
    try {
      await drive.permissions
        .create({
          fileId: workoutLog.id,
          resource: {
            type: 'anyone',
            role: 'reader',
          },
        })
        .then(() => {});
    } catch (error) {
      // FAIL SILENTLY
      console.log(error);
      console.log(`Failed to make workout log viewable by anyone with link`);
    }

    // Give edit permissions to TFC managers
    const managers = (process.env.TFC_MANAGERS || '').split(',');

    if (managers.length) {
      for (const manager of managers) {
        try {
          await drive.permissions
            .create({
              fileId: workoutLog.id,
              resource: {
                type: 'user',
                role: 'writer',
                emailAddress: manager,
              },
            })
            .then(() => {});
        } catch (error) {
          // FAIL SILENTLY
          console.log(error);
          console.log(`Failed to give edit permissions to ${manager}`);
        }
      }
    }
  }

  return workoutLog;
};
