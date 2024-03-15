const log4js = require('log4js');

log4js.configure({
  appenders: {
    out: {type: 'stdout'},
    app: {
      type: 'dateFile', filename: 'logs/application.log', numBackups: 5, keepFileExt: true,
    },
  },
  categories: {default: {appenders: ['out', 'app'], level: 'debug'}},
});

const logger = log4js.getLogger();
module.exports = logger;
module.export;
