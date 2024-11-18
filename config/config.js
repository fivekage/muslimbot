require('dotenv').config();
const { DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD } = process.env;
const logger = require('../utils/logger.js');

if (!DB_HOST || !DB_USERNAME || !DB_PASSWORD) {
   logger.fatal('Please provide a valid db host, username and password');
   process.exit(1);
}

const dbConfig = {
   host: DB_HOST,
   database: DB_DATABASE,
   username: DB_USERNAME,
   password: DB_PASSWORD,
   dialect: 'mariadb',
   dialectModule: require('mariadb'),
   benchmark: true, // <-- this one enables tracking execution time
   logging: (sql, timingMs) => {
      if (timingMs > 5)
         logger.debug(`${sql} - [Execution time: ${timingMs}ms]`);
   }, // Log only if query time is greater than 5ms
};

module.exports = {
   development: dbConfig,
   production: dbConfig,
};