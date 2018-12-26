const { google } = require("googleapis");
const readline = require("readline");
const fs = require("fs");
const formatDate = require("date-fns/format");

const getWorkoutLog = require("./getWorkoutLog");
const templateLogWorkout = require("./templateLogWorkout");

const TOKEN_PATH = "config/google-token.json";
const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.metadata",
  "https://www.googleapis.com/auth/spreadsheets"
];
let names = ["Steven", "McFarts", "Borsin", "Charlie", "Angela", "Dracula"];
let config = {};
let g = {
  drive: null,
  sheets: null,
  cache: {}
};

fs.readFile("config/google.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  config = JSON.parse(content);
  authorize(config.installed, auth => {
    initializeClients(auth);
    // tallyWorkout({});
  });
});

const authorize = (credentials, callback) => {
  const { client_secret, client_id, redirect_uris } = credentials;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) {
      return getNewToken(oAuth2Client, callback);
    }
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
};

const getNewToken = (oAuth2Client, callback) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });

  console.log("Authorize this app by visiting this url:", authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question("Enter the code from that page here: ", code => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err)
        return console.error(
          "Error while trying to retrieve access token",
          err
        );
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
        if (err) console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
};

const initializeClients = auth => {
  g.drive = google.drive({ version: "v3", auth });
  g.sheets = google.sheets({ version: "v4", auth });
};

const tallyWorkout = async ({ userName, exercise, duration, date }) => {
  let year = formatDate(date, "YYYY");
  let month = formatDate(date, "MMM");
  let { directoryID } = config;

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

module.exports = { tallyWorkout };
