const Discord = require("discord.js");
const authToken = process.env.DISCORD_TOKEN;

const client = new Discord.Client({ autoReconnect: true });

client
  .login(authToken)
  .then(() => {})
  .catch((error) => console.error(error));

module.exports = client;
