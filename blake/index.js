const Discord = require("discord.js");
const authToken = process.env.DISCORD_TOKEN;
const crons = require("./crons");
const logWorkout = require("./logWorkout");
const { isLog } = require("../utils");

const client = new Discord.Client();

client
  .login(authToken)
  .then(() => {})
  .catch(error => console.error(error));

client.on("ready", () => {
  // console.log(client.guilds);
  console.log(client.user.username, "is up and running.");
  crons(client);
});

client.on("message", async message => {
  let { author, channel, content } = message;

  if (author.bot) return;

  if (channel.name === "log-your-workout" && isLog(content)) {
    await logWorkout(message);
  }

  if (message.isMentioned(client.user)) {
    message.reply("yes?");
  }
});
