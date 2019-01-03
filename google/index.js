const { google } = require("googleapis");
const formatDate = require("date-fns/format");
const subMonths = require("date-fns/sub_months");
const isAfter = require("date-fns/is_after");
const isBefore = require("date-fns/is_before");
const calendarMonthsDiff = require("date-fns/difference_in_calendar_months");

const {
  formatLogDate,
  flatDate,
  Member,
  LOG_COLUMNS,
  TALLY_COLUMNS
} = require("../utils");
const authorize = require("./authorize");
const getWorkoutLog = require("./getWorkoutLog");
const templateLogWorkout = require("./templateLogWorkout");

let directoryID = process.env.TFC_DIRECTORY_ID;

// FOR TESTING
// let members = [
//   new Member({ user: { id: "a111", username: "Steven" }, nickname: "Soots" }),
//   new Member({ user: { id: "a112", username: "McFarts" }, nickname: "Poots" }),
//   new Member({ user: { id: "a113", username: "Borsin" }, nickname: "Boots" }),
//   new Member({ user: { id: "a114", username: "Thomas" }, nickname: "Toots" }),
//   new Member({ user: { id: "a115", username: "Angela" }, nickname: "Bertha" }),
//   new Member({ user: { id: "a116", username: "Florence" }, nickname: "Foots" })
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

/**
 * Get full sheet data for tallies
 * and a set of months
 */
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

/**
 * Within a range of two dates (exclusive), get
 * - Days worked out
 * - Workouts Logged
 * As well as
 * - Total workouts for the year
 */
const getWorkoutCounts = async (fromDate, toDate) => {
  let date = flatDate(); //currentTimeZone();
  let year = date.getFullYear();
  let workoutLog, tallyData;

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
    tallyData = dataSets.shift(); //no need for tallies as of yet
  } catch (error) {
    throw error;
  }

  let dateMap = {};
  let memberMap = {};
  dataSets.map(({ values }) => {
    values.shift();
    values.map(row => {
      let dateValue = `${row[LOG_COLUMNS.DATE]} ${year}`; // MMM DD YYYY
      dateMap[dateValue] = dateMap[dateValue] || flatDate(new Date(dateValue)); //currentTimeZone(new Date(dateValue));

      if (
        isAfter(dateMap[dateValue], fromDate) &&
        isBefore(dateMap[dateValue], toDate)
      ) {
        let member = row[LOG_COLUMNS.ID];
        memberMap[member] = memberMap[member] || {
          username: "",
          workoutsLogged: 0,
          daysWorkedOut: 0,
          yearTotal: 0
        };

        memberMap[member].workoutsLogged++;

        memberMap[member].username =
          memberMap[member].username || row[LOG_COLUMNS.MEMBER];

        row[LOG_COLUMNS.FIRST_OF_DAY] === "yes" &&
          memberMap[member].daysWorkedOut++;
      }
    });
  });

  tallyData.values.forEach(row => {
    let id = row[TALLY_COLUMNS.ID];
    if (memberMap[id]) {
      memberMap[id].yearTotal = parseInt(row[TALLY_COLUMNS.TOTAL]);
    }
  });

  return memberMap;
};

/**
 * TALLY WORKOUT
 */
const tallyWorkout = async ({
  members,
  exercise,
  duration,
  date,
  logTime,
  imageURL
}) => {
  let member = members[0]; // duh not good
  let year = formatDate(date, "YYYY");
  let month = formatDate(date, "MMM");
  // let firstOfDay = true;
  let workoutLog;

  try {
    workoutLog = await getWorkoutLog(g, directoryID, year);
  } catch (error) {
    throw error;
  }

  // FOR TESTING
  // member = members[Math.floor(Math.random() * members.length)];

  // Fetch the current data set for tallies and logs
  let tallyData, logData;
  try {
    let dataSets = await fetchData(workoutLog, [month]);
    tallyData = dataSets[0];
    logData = dataSets[1];
  } catch (error) {
    throw error;
  }

  // Perform update
  try {
    await g.sheets.spreadsheets
      .batchUpdate(
        templateLogWorkout(
          workoutLog,
          tallyData.values,
          logData.values,
          month,
          members,
          exercise,
          duration,
          date,
          logTime,
          imageURL
        )
      )
      .then(() => {});
  } catch (error) {
    console.log(error);
    throw new Error("Failed to update spreadsheet");
  }
};

module.exports = { getWorkoutCounts, tallyWorkout };
