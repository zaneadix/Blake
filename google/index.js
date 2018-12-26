const { google } = require("googleapis");
const formatDate = require("date-fns/format");

const authorize = require("./authorize");
const getWorkoutLog = require("./getWorkoutLog");
const templateLogWorkout = require("./templateLogWorkout");

let directoryID = process.env.TFC_DIRECTORY_ID;
let names = ["Steven", "McFarts", "Borsin", "Charlie", "Angela", "Dracula"];

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

const tallyWorkout = async ({ userName, exercise, duration, date }) => {
  let year = formatDate(date, "YYYY");
  let month = formatDate(date, "MMM");

  let workoutLog = await getWorkoutLog(g, directoryID, year, month);

  userName = names[Math.floor(Math.random() * names.length)];

  if (workoutLog) {
    // Get tally data for updating
    let tallyData;
    await g.sheets.spreadsheets.values
      .get({
        spreadsheetId: workoutLog.id,
        range: "Tally",
        majorDimension: "ROWS"
      })
      .then(({ data }) => {
        tallyData = data.values;
      })
      .catch(error => console.log(error));

    if (tallyData) {
      await g.sheets.spreadsheets
        .batchUpdate(
          templateLogWorkout(
            workoutLog,
            tallyData,
            month,
            userName,
            exercise,
            duration,
            date
          )
        )
        .then(() => {})
        .catch(error => console.log(error.errors));
    }
  }

  return;
};

// tallyWorkout({
//   userName: "zane",
//   exercise: "ham",
//   duration: "60min",
//   date: new Date()
// });

initializeClients();

module.exports = { tallyWorkout };
