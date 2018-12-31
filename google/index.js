const { google } = require("googleapis");
const formatDate = require("date-fns/format");
const subMonths = require("date-fns/sub_months");
const isAfter = require("date-fns/is_after");
const isBefore = require("date-fns/is_before");
const calendarMonthsDiff = require("date-fns/difference_in_calendar_months");

const { formatLogDate, currentTimeZone, LOG_COLUMNS } = require("../utils");
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
initializeClients();

const fetchData = async (workoutLog, months) => {
  let result;
  try {
    await g.sheets.spreadsheets.values
      .batchGet({
        spreadsheetId: workoutLog.id,
        ranges: ["Tally", ...months],
        majorDimension: "ROWS"
      })
      .then(({ data }) => {
        result = data.valueRanges;
      });
  } catch (error) {
    console.log(error);
    throw new Error("Failed to retrieve spreadsheet values");
  }

  return result;
};

const getWorkoutCounts = async (fromDate, toDate) => {
  // await initializeClients();
  let date = currentTimeZone();
  let year = date.getFullYear();
  let workoutLog;

  try {
    workoutLog = await getWorkoutLog(g, directoryID, year);
  } catch (error) {
    throw error;
  }

  let diff = calendarMonthsDiff(date, fromDate);
  let months = [formatDate(date, "MMM")];
  for (let i = 0; i < diff; i++) {
    date = subMonths(date, 1);
    months.push(formatDate(date, "MMM"));
  }

  let dataSets;
  try {
    dataSets = await fetchData(workoutLog, months);
    dataSets.shift(); //no need for tallies as of yet
  } catch (error) {
    throw error;
  }

  let dateMap = {};
  let memberMap = {};
  dataSets.map(({ values }) => {
    values.shift();
    values.map(row => {
      let dateValue = `${row[LOG_COLUMNS.DATE]} ${year}`; // MMM DD YYYY
      dateMap[dateValue] =
        dateMap[dateValue] || currentTimeZone(new Date(dateValue));

      if (
        isAfter(dateMap[dateValue], fromDate) &&
        isBefore(dateMap[dateValue], toDate)
      ) {
        let member = row[LOG_COLUMNS.ID];
        memberMap[member] = memberMap[member] || {
          username: "",
          workoutsLogged: 0,
          daysWorkedOut: 0
        };

        memberMap[member].workoutsLogged++;

        memberMap[member].username =
          memberMap[member].username || row[LOG_COLUMNS.MEMBER];

        row[LOG_COLUMNS.FIRST_OF_DAY] === "yes" &&
          memberMap[member].daysWorkedOut++;
      }
    });
  });

  return memberMap;
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
    workoutLog = await getWorkoutLog(g, directoryID, year);
  } catch (error) {
    throw error;
  }

  // FOR TESTING
  // user = users[Math.floor(Math.random() * users.length)];

  // Fetch the current data set for tallies and logs
  let tallyData, logData;
  try {
    let dataSets = await fetchData(workoutLog, [month]);
    tallyData = dataSets[0];
    logData = dataSets[1];
  } catch (error) {
    throw error;
  }

  // See if anythoing else was already logged today by this user
  if (logData) {
    firstOfDay = !logData.values.find(row => {
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
            tallyData.values,
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

module.exports = { getWorkoutCounts, tallyWorkout };
