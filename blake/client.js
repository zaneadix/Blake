let Discord = require('discord.js');
let logger = require('../logger');
let authToken = process.env.DISCORD_TOKEN;

let client = new Discord.Client();

client
  .login(authToken)
  .then(() => {})
  .catch(error => logger.error(error));

module.exports = client;
