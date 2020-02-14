const { google } = require("googleapis");
const geocoder = require("google-geocoder");
const MapsClient = require("@googlemaps/google-maps-services-js").Client;
const formatDate = require("date-fns/format");
const sub = require("date-fns/sub");
const isAfter = require("date-fns/isAfter");
const isBefore = require("date-fns/isBefore");
const calendarMonthsDiff = require("date-fns/differenceInMonths");

const { flatDate, LOG_COLUMNS, TALLY_COLUMNS } = require("../utils");
const getWorkoutLog = require("./getWorkoutLog");
const templateLogWorkout = require("./templateLogWorkout");

let directoryID = process.env.TFC_DIRECTORY_ID;

const jwtClient = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.metadata",
    "https://www.googleapis.com/auth/spreadsheets"
  ]
);

let maps = new MapsClient({});

let g = {
  drive: google.drive({ version: "v3" }),
  sheets: google.sheets({ version: "v4" }),
  geocode: maps.geocode,
  timezone: maps.timezone,
  cache: {}
};

const initializeClients = async () => {
  let auth = await new Promise(resolve => {
    jwtClient
      .authorize()
      .then(() => {
        console.log("Google APIs authorized");
        resolve(jwtClient);
      })
      .catch(shit => console.log(shit));
  });
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

const getDataFrom = async fromDate => {
  let date = flatDate();
  let year = date.getFullYear();
  let workoutLog;

  try {
    workoutLog = await getWorkoutLog(g, directoryID, year);
  } catch (error) {
    throw error;
  }

  let diff = calendarMonthsDiff(date, fromDate);
  let monthNames = [formatDate(date, "MMM")];
  for (let i = 0; i < diff; i++) {
    date = sub(date, { months: 1 });
    monthNames.push(formatDate(date, "MMM"));
  }

  let months;
  let tally;
  try {
    months = await fetchData(workoutLog, monthNames);
    tally = months.shift();
  } catch (error) {
    throw error;
  }

  return {
    months,
    tally
  };
};

const filterLogs = (months, fromDate, toDate, onMatch) => {
  let year = new Date().getFullYear();
  let dateMap = {};
  months.forEach(({ values }) => {
    values.shift();
    values.forEach(row => {
      let dateValue = `${row[LOG_COLUMNS.DATE]} ${year}`; //date key
      dateMap[dateValue] = dateMap[dateValue] || flatDate(new Date(dateValue));

      if (
        isAfter(dateMap[dateValue], fromDate) &&
        isBefore(dateMap[dateValue], toDate)
      ) {
        onMatch(row);
      }
    });
  });
};

const getLogsInRange = async (memberId, fromDate, toDate) => {
  let data;
  try {
    data = await getDataFrom(fromDate);
  } catch (error) {
    throw error;
  }

  let { months } = data;
  let logs = [];

  filterLogs(months, fromDate, toDate, row => {
    if (row[LOG_COLUMNS.ID] === memberId) {
      logs.push({
        activity: row[LOG_COLUMNS.EXERCISE],
        duration: row[LOG_COLUMNS.DURATION],
        date: row[LOG_COLUMNS.DATE],
        picture: row[LOG_COLUMNS.PICTURE],
        firstOfDay: row[LOG_COLUMNS.FIRST_OF_DAY]
      });
    }
  });

  return logs;
};

/**
 * Within a range of two dates (exclusive), get
 * - Days worked out
 * - Workouts Logged
 * As well as
 * - Total workouts for the year
 */
const getActivityCountsInRange = async (fromDate, toDate) => {
  let data;
  try {
    data = await getDataFrom(fromDate);
  } catch (error) {
    throw error;
  }

  let { months, tally } = data;

  let memberMap = {};

  tally.values.shift();
  tally.values.map(row => {
    let id = row[LOG_COLUMNS.ID];
    let username = row[LOG_COLUMNS.MEMBER];
    memberMap[id] = memberMap[id] || {
      username,
      workoutsLogged: 0,
      daysWorkedOut: 0,
      yearTotal: parseInt(row[TALLY_COLUMNS.TOTAL])
    };
  });

  filterLogs(months, fromDate, toDate, row => {
    let id = row[LOG_COLUMNS.ID];
    memberMap[id].workoutsLogged++;
    // use most recent username?
    // memberMap[id].username = memberMap[id].username || row[LOG_COLUMNS.MEMBER];
    row[LOG_COLUMNS.FIRST_OF_DAY] === "yes" && memberMap[id].daysWorkedOut++;
  });

  return memberMap;
};

const tallyWorkout = async ({
  members,
  workout,
  duration,
  date,
  logTime,
  imageURL
}) => {
  let year = formatDate(date, "yyyy");
  let month = formatDate(date, "MMM");
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
          workout,
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

const getTimeZone = async address => {
  let geometry;
  let timeZone;

  try {
    let response = await g.geocode({
      params: { address, key: process.env.GOOGLE_MAPS_API_KEY }
    });
    geometry = response.data.results[0].geometry;
    console.log("GEOMETRY", geometry);
  } catch (error) {
    console.log(error);
    throw new Error("Failed to retrieve geometry from provided address");
  }

  try {
    let response = await g.timezone({
      params: {
        location: `${geometry.location.lat}, ${geometry.location.lng}`,
        timestamp: Math.floor(Date.now() / 1000), // timestamp in seconds
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });
    timeZone = response.data.timeZoneId;
    console.log("TIME ZONE", timeZone);
  } catch (error) {
    console.log(error);
    throw new Error("Failed to retrieve timezone from provided geometry");
  }

  return timeZone;
};

module.exports = {
  getLogsInRange,
  getActivityCountsInRange,
  tallyWorkout,
  getTimeZone
};
