const { google } = require("googleapis");
const formatDate = require("date-fns/format");

const { formatLogDate, LOG_COLUMNS } = require("./utils");
const authorize = require("./authorize");
const getWorkoutLog = require("./getWorkoutLog");
const templateLogWorkout = require("./templateLogWorkout");

let directoryID = process.env.TFC_DIRECTORY_ID;

// FOR TESTING
// let users = [
//   { id: "a111", username: "Steven" },
//   { id: "a112", username: "McFarts" },
//   { id: "a113", username: "Borsin" },
//   { id: "a114", username: "Thomas" },
//   { id: "a115", username: "Angela" },
//   { id: "a116", username: "Florence" }
// ];

let g = {
  drive: google.drive({ version: "v3" }),
  sheets: google.sheets({ version: "v4" }),
  cache: {}
};

const initializeClients = async () => {
  let auth = await authorize();
  g.drive = google.drive({ version: "v3", auth });
  g.sheets = google.sheets({ version: "v4", auth });
};

const tallyWorkout = async ({
  user,
  exercise,
  duration,
  date,
  logTime,
  imageURL
}) => {
  let year = formatDate(date, "YYYY");
  let month = formatDate(date, "MMM");
  let firstOfDay = true;
  let workoutLog;

  try {
    workoutLog = await getWorkoutLog(g, directoryID, year, month);
  } catch (error) {
    throw error;
  }

  // FOR TESTING
  // user = users[Math.floor(Math.random() * users.length)];

  // Fetch the current data set for tallies and logs
  let tallyData, logData;
  try {
    await g.sheets.spreadsheets.values
      .batchGet({
        spreadsheetId: workoutLog.id,
        ranges: ["Tally", month],
        majorDimension: "ROWS"
      })
      .then(({ data }) => {
        tallyData = data.valueRanges[0].values;
        logData = data.valueRanges[1].values;
      });
  } catch (error) {
    console.log(error);
    throw new Error("Failed to retrieve spreadsheet values");
  }

  // See if anythoing else was already logged today by this user
  if (logData) {
    firstOfDay = !logData.find(row => {
      return (
        row[LOG_COLUMNS.ID] === user.id &&
        row[LOG_COLUMNS.DATE] === formatLogDate(date)
      );
    });
  }

  // Perform update
  if (tallyData) {
    try {
      await g.sheets.spreadsheets
        .batchUpdate(
          templateLogWorkout(
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
          )
        )
        .then(() => {});
    } catch (error) {
      console.log(error);
      throw new Error("Failed to update spreadsheet");
    }
  }
};

initializeClients();

module.exports = { tallyWorkout };
