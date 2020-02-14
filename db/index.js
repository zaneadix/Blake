let redis = require("redis");
let dbClient = redis.createClient();
const { promisify } = require("util");

class UserData {
  constructor(user, timeZone) {
    this.id = user.id;
    this.name = user.username;
    this.timeZone = timeZone || `America/New_York`;
  }
}

dbClient.on("error", function(err) {
  console.log("Error " + err);
});

let getAsync = promisify(dbClient.get).bind(dbClient);
let setAsync = promisify(dbClient.set).bind(dbClient);

let getUserData = async user => {
  userData = await getAsync(user.id).then((value, error) => {
    if (error) throw error;
    return value ? JSON.parse(value) : new UserData(user);
  });

  return userData;
};

let setUserData = async (user, userData) => {
  await setAsync(user.id, JSON.stringify(userData));
};

module.exports = { dbClient, getUserData, setUserData };
