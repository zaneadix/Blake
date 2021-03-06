const Discord = require('discord.js');
const _find = require('lodash/find');
const client = require('./client');

let helpMenus = {};
let embedColor = 0xfbc02d;
let commandMatcher = /help ([a-z]+)/;

class ManualPage {
  constructor(params) {
    this.embed = {
      color: embedColor,
      title: '',
      description: '',
      footer: {
        text: `I've got your back 👍`,
      },
    };
    Object.assign(this.embed, params);
  }
}

let commands = {
  activity: {
    icon: '📈',
    name: 'Activity',
    summary: 'get a direct message summary of a users activity',
    format: `activity [of {user}] [from {date}] [to {date}]`,
    detail: ['get a direct message summary of a users activity.', '-----'].join('\n'),
    fields: [
      {
        name: '**Default Behavior**',
        value: [
          "If you _don't_ specify a _user_, _from_ or _to_ date, you will get a summary of _your_ the last _10 days_.",
          '-----',
        ].join('\n'),
      },
      {
        name: '**Of** _optional_',
        value: ['the user you would like a summary of', '_Format_ : `@tommy`', '-----'].join('\n'),
      },
      {
        name: '**From / To** _optional_',
        value: [
          'the _start_ and _end_ date of the summary range',
          '_Format_ : `MM/DD`',
          '_Example_ : `from 2/22`',
          '-----',
        ].join('\n'),
      },
      {
        name: '**Example Commands**',
        value: [
          '```',
          'activity',
          '',
          'activity from 1/20',
          '',
          'activity from 1/20 to 2/10',
          '',
          'activity of @tommy from 1/15',
          '```',
        ].join('\n'),
      },
    ],
  },
  help: {
    icon: '❓',
    name: 'Help',
    summary: 'get general or detailed help',
    format: `help [command]`,
    detail: ['The help command gives guidance on how to work with me.', '-----'].join('\n'),
    fields: [
      {
        name: '**Default Behavior**',
        value: [
          "If you _don't_ specify a command, you will get commands page of the manual. This manual.",
          '-----',
        ].join('\n'),
      },
      {
        name: '**Command**',
        value: ["If you _do_ specify a command, you'll get specifc guidelines for that command.", '-----'].join('\n'),
      },
      {
        name: '**Example Commands**',
        value: ['```', 'help', '', 'help log', '```'].join('\n'),
      },
    ],
  },
  log: {
    icon: '📋',
    name: 'Log',
    summary: 'log recent activity',
    format: `log {duration} of {activity} [on {date}] [with {partners}]`,
    detail: [
      'The log command allows you to log activity.',
      'Log commands _MUST_ be submitted in the logging channel',
      '-----',
    ].join('\n'),
    fields: [
      {
        name: '**Command Format**',
        value: ['`log {duration} of {activity} [on {date}] [with {partners}]`', '-----'].join('\n'),
      },
      {
        name: '**Duration**',
        value: [
          'The amount of time spent active.',
          '_Format_ : `{number} {unit}`',
          '_Example_ : `10 minutes`',
          '\xa0\xa0\xa0- Number can contain decimals',
          '\xa0\xa0\xa0- Acceptable time units are `min`, `mins`, `minutes`, `hr`, `hrs`, `hour`, `hours`',
          '-----',
        ].join('\n'),
      },
      {
        name: '**Activity**',
        value: [
          'The activity you have completed.',
          '_Example_ : `weight lifting/cardio`',
          '_Can contain_ :',
          '\xa0\xa0\xa0- Alphabetical characters',
          '\xa0\xa0\xa0- The special characters: ( )  / _ -',
          '-----',
        ].join('\n'),
      },
      {
        name: `**Date** _\*optional\*_`,
        value: [
          "The date the activity was completed. If you don't provide a date, your activity will be logged on todays date.",
          '_Format_ : `MM/DD[/YY]`',
          '_Example_ : `2/22`',
          '-----',
        ].join('\n'),
      },
      {
        name: `**Partners** _\*optional\*_`,
        value: [
          "If you worked out with others you can mention them here to log the same workout for everyone. These can be comma separated or speced with the word 'and' in case you want to write like a human.",
          '_Format_ : `@steve @britney @rashida`',
          '-----',
        ].join('\n'),
      },
      {
        name: '**Example Commands**',
        value: [
          '```',
          '30 min of biking to work',
          '',
          '1 hr of cartwheels',
          '',
          '2 hours of jumping up and down on 2/22/17',
          '',
          '10 minutes of brick punching with @ShaunT @TonyH @myCat',
          '',
          '12 hrs of running in circles on 1/1 with @mom, @sister and @dad',
          '',
          '1.5 hours of gym (wights/cardio)',
          '```',
        ].join('\n'),
      },
    ],
  },
  timezone: {
    icon: '🕑',
    name: 'Time Zone',
    summary: 'get or set your time zone',
    format: `timezone [location]`,
    detail: ["The timezone command let's you set and retrieve your current timezone.", '-----'].join('\n'),
    fields: [
      {
        name: '**Default Behavior**',
        value: [
          "If you _don't_ specify a timezone, I'll just return your current time zone setting. By default, your time zone is America/New_York (Eastern Standard)",
          '-----',
        ].join('\n'),
      },
      {
        name: '**Location**',
        value: [
          'If you _do_ specify an location, your time zone will be set to whatever time zone that location falls within.',
          '-----',
        ].join('\n'),
      },
      {
        name: '**Example Commands**',
        value: ['```', 'timezone', '', 'timezone london', '', 'timezone 123 banana st richmond va', '```'].join('\n'),
      },
    ],
  },
};

let buttons = ['📕'];

let fields = [];
Object.keys(commands).forEach((key, index, array) => {
  let command = commands[key];
  fields.push({
    name: `${command.icon} **${command.name}** - _${command.summary}_`,
    value: `\`${command.format}\`${index < array.length - 1 ? '\n----' : ''}`,
  });
  buttons.push(command.icon);
});

const handleHelpRequest = async messageOrReaction => {
  let command;
  let channel;
  let response;

  if (messageOrReaction instanceof Discord.Message) {
    channel = messageOrReaction.channel;
    commandName = (commandMatcher.exec(messageOrReaction.content) || [])[1];
    command = commands[commandName];
  } else if (messageOrReaction instanceof Discord.MessageReaction) {
    channel = messageOrReaction.message.channel;
    command = _find(commands, command => command.icon === messageOrReaction.emoji.name);
  }

  helpMenus[channel.id] = helpMenus[channel.id] || {
    message: undefined,
    timeoutID: undefined,
  };
  let menu = helpMenus[channel.id];

  if (command) {
    response = new ManualPage({
      title: `${command.icon} **${command.name}**`,
      description: command.detail,
      fields: command.fields,
    });
  } else {
    response = new ManualPage({
      title: `📕 **Blake Manual**`,
      description: [
        `Yo! Below you'll find a summary of all the commands I understand and how to use them. For more detailed information on a command, simply click the emoji at the bottom that matches the command.`,
        ``,
        `**Guidelines**`,
        ` 🥇 Make sure your command comes _first_ in your message`,
        ` 🥈 Preface your command by @ing me (@${client.user.username})`,
        ` 🥉 {} = parameter, [] = optional`,
        ` 🏆 Remember, you can do whatever you set your mind to`,
        '',
        '**Example Command Submission**',
        '```',
        `@${client.user.username} log 20 minutes of running`,
        '```',
        '**Commands**',
      ].join('\n'),
      fields,
    });
  }
  let shouldInit = !menu.message;

  try {
    if (menu.message) {
      await menu.message.edit(response);
    } else {
      menu.message = await channel.send(response);
    }
  } catch (error) {
    console.log(error);
    throw error;
  }

  //Remove help menu after 10 minutes of inactivity
  menu.timeoutID && clearTimeout(menu.timeoutID);
  menu.timeoutID = setTimeout(async () => {
    try {
      await menu.message.reactions.removeAll();
      await menu.message.edit(
        new ManualPage({
          thumbnail: {},
          description: `This help menu has expired. Hit me up for help anytime using \`@${client.user.username} help\``,
        }),
      );
      delete helpMenus[channel.id];
    } catch (error) {
      console.log(error);
    }
  }, 600000); //10 minutes

  if (shouldInit) {
    try {
      buttons.forEach(async button => {
        await menu.message.react(button);
      });
    } catch (error) {
      console.log(error);
    }
  }
};

const updateHelpMenu = (reaction, user) => {
  let channel = reaction.message.channel;
  let menu = helpMenus[channel.id];
  if (menu && reaction.message.id === menu.message.id && user.id !== client.user.id) {
    reaction.users.remove(user);
    if (buttons.includes(reaction.emoji.name)) {
      handleHelpRequest(reaction);
    }
  }
};

module.exports = {
  updateHelpMenu,
  provideHelp: message => handleHelpRequest(message),
};
