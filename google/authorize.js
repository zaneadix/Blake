const { google } = require("googleapis");

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

module.exports = () => {
  return new Promise(resolve => {
    jwtClient
      .authorize()
      .then(() => {
        console.log("Google APIs authorized");
        resolve(jwtClient);
      })
      .catch(shit => console.log(shit));
  });
};
