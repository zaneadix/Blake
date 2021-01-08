let log4js = require('log4js');

log4js.configure({
  appenders: { info: { type: 'file', filename: 'info.log' } },
  categories: { default: { appenders: ['info'], level: 'info' } },
});

let logger = log4js.getLogger('info');
module.exports = logger;
