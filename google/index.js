const { google } = require("googleapis");
const formatDate = require("date-fns/format");

const { formatLogDate } = require("./utils");
const authorize = require("./authorize");
const getWorkoutLog = require("./getWorkoutLog");
const templateLogWorkout = require("./templateLogWorkout");

let directoryID = process.env.TFC_DIRECTORY_ID;
// let names = ["Steven", "McFarts", "Borsin", "Charlie", "Angela", "Dracula"];

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
    // console.log("Failed to retrieve workout log");
    throw error;
  }

  // userName = names[Math.floor(Math.random() * names.length)];

  // Get tally data for updating

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

  // let tallyData, logData;
  // await g.sheets.spreadsheets.values
  //   .batchGet({
  //     spreadsheetId: workoutLog.id,
  //     ranges: ["Tally", month],
  //     majorDimension: "ROWS"
  //   })
  //   .then(({ data }) => {
  //     tallyData = data.valueRanges[0].values;
  //     logData = data.valueRanges[1].values;
  //   })
  //   .catch(error => console.log(error));

  if (logData) {
    firstOfDay = !logData.find(row => {
      return row[0] === user.id && row[4] === formatLogDate(date);
    });
  }

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
