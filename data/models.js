const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();
const logger = require('../utils/logger.js');

const sequelizeInstance = () => {
   const { DB_HOST } = process.env;
   const DB_DATABASE = process.env.DB_DATABASE ?? 'muslimbot';
   const { DB_USERNAME } = process.env;
   const { DB_PASSWORD } = process.env;

   if (!DB_HOST || !DB_USERNAME || !DB_PASSWORD) {
      logger.fatal('Please provide a valid db host, username and password');
      process.exit(1);
   }

   logger.info('Database Used :', DB_DATABASE);

   const connectionStr = `mariadb://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}/${DB_DATABASE}`;
   return new Sequelize(connectionStr, {
      host: DB_HOST,
      database: DB_DATABASE,
      username: DB_USERNAME,
      password: DB_PASSWORD,
      dialect: 'mariadb',
      dialectModule: require('mariadb'),
      benchmark: true, // <-- this one enables tracking execution time
      logging: (sql, timingMs) => {
         timingMs > 5 ?? logger.debug(`${sql} - [Execution time: ${timingMs}ms]`);
      }, // Log only if query time is greater than 10ms
   });
};

const sequelize = sequelizeInstance();
module.exports.init = async (client) => {
   try {
      await sequelize.authenticate();
      logger.info('Connection has been established successfully.');
   } catch (error) {
      logger.fatal('Unable to connect to the database:', error);
      throw error;
   }

   const usersModel = sequelize.define('Users', {
      id: {
         type: DataTypes.INTEGER,
         autoIncrement: true,
         primaryKey: true,
      },
      userId: {
         type: DataTypes.STRING,
         unique: true,
      },
      guildId: {
         type: DataTypes.STRING,
         allowNull: true,
      },
      subscribedChangelog: {
         type: DataTypes.BOOLEAN,
         defaultValue: true,
      },
   });

   const subscriptionsModel = sequelize.define('Subscriptions', {
      id: {
         type: DataTypes.INTEGER,
         autoIncrement: true,
         primaryKey: true,
      },
      city: DataTypes.STRING,
      country: DataTypes.STRING,
      subscriptionEnabled: DataTypes.BOOLEAN,
   }, {
      hooks: {
         afterCreate: async (subscription, _options) => {
            const { schedulePrayerNewSubscription } = require('../cron/schedule_notifications.js');
            schedulePrayerNewSubscription(client, subscription);
         },
      },
   });

   const notificationsModel = sequelize.define('Notifications', {
      id: {
         type: DataTypes.INTEGER,
         autoIncrement: true,
         primaryKey: true,
      },
      prayer: DataTypes.STRING,
      sent: DataTypes.BOOLEAN,
   });

   const guildsModel = sequelize.define('Guilds', {
      id: {
         type: DataTypes.INTEGER,
         autoIncrement: true,
         primaryKey: true,
      },
      guildId: DataTypes.STRING,
      guildName: DataTypes.STRING,
      isStillInGuild: DataTypes.BOOLEAN,
      channelAnnouncementId: DataTypes.STRING,
      dailyHadithEnabled: {
         type: DataTypes.BOOLEAN,
         defaultValue: true,
      },
   });

   const quizzQuestionsModel = sequelize.define('QuizzQuestions', {
      id: {
         type: DataTypes.INTEGER,
         autoIncrement: true,
         primaryKey: true,
      },
      question: DataTypes.STRING,
      enabled: {
         type: DataTypes.BOOLEAN,
         defaultValue: true,
      },
   });

   const quizzAnswersModel = sequelize.define('QuizzAnswers', {
      id: {
         type: DataTypes.INTEGER,
         autoIncrement: true,
         primaryKey: true,
      },
      valid: DataTypes.BOOLEAN,
      answer: DataTypes.STRING,
      enabled: {
         type: DataTypes.BOOLEAN,
         defaultValue: true,
      },
   });

   const versionsModel = sequelize.define('Versions', {
      id: {
         type: DataTypes.INTEGER,
         autoIncrement: true,
         primaryKey: true,
      },
      versionNumber: {
         // eslint-disable-next-line new-cap
         type: DataTypes.STRING(10),
         unique: true,
      },
      // eslint-disable-next-line new-cap
      changelog: DataTypes.STRING(10000),
   });

   usersModel.hasOne(subscriptionsModel);
   subscriptionsModel.belongsTo(usersModel);

   usersModel.hasMany(notificationsModel);
   notificationsModel.belongsTo(usersModel);
   subscriptionsModel.hasMany(notificationsModel);
   notificationsModel.belongsTo(subscriptionsModel);
   quizzQuestionsModel.hasMany(quizzAnswersModel);
   quizzAnswersModel.belongsTo(quizzQuestionsModel);

   if (process.env.NODE_ENV != 'production') {
      await sequelize.sync({ match: /.*_dev$/ });
   }

   await usersModel.sync();
   await subscriptionsModel.sync();
   await notificationsModel.sync();
   await guildsModel.sync();
   await quizzQuestionsModel.sync();
   await quizzAnswersModel.sync();
   await versionsModel.sync();
};

module.exports.usersModel = () => sequelize.models.Users;

module.exports.subscriptionsModel = () => sequelize.models.Subscriptions;

module.exports.notificationsModel = () => sequelize.models.Notifications;

module.exports.guildsModel = () => sequelize.models.Guilds;

module.exports.quizzQuestionsModel = () => sequelize.models.QuizzQuestions;

module.exports.quizzAnswersModel = () => sequelize.models.QuizzAnswers;

module.exports.versionsModel = () => sequelize.models.Versions;

