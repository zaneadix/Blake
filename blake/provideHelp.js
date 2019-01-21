const client = require('./client');

const commands = {
  help: {
    format: `@${client.user.username} help [command]`,
    message: [``].join('\n')
  },
  log: {},
  activity: {}
};

const provideHelp = async message => {
  message.channel.send();
};

module.exports = provideHelp;
