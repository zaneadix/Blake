let log4js = require('log4js');

log4js.configure({
  appenders: { out: { type: 'stdout', layout: { type: 'pattern', pattern: '[%c] %m%n' } } },
  categories: { default: { appenders: ['out'], level: 'info' } },
  pm2: true,
  pm2InstanceVar: 'INSTANCE_ID',
});

let logger = log4js.getLogger('info');
module.exports = logger;
