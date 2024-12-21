const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();
const logger = require('../utils/logger.js');

const config = require('../config/config.js');

const sequelizeInstance = () => {
   logger.info('Database Used :', config[process.env.NODE_ENV].database);
   return new Sequelize(config[process.env.NODE_ENV]);
};

const sequelize = sequelizeInstance();
module.exports = {
   defineModels: async (client) => {
      try {
         await sequelize.authenticate();
         logger.info('Connection has been established successfully.');
      } catch (error) {
         logger.fatal('Unable to connect to the database:', error);
         throw error;
      }

      // Tables
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
         timezone: {
            type: DataTypes.STRING,
            allowNull: true,
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

      const guildsModel = sequelize.define('Guilds', { // eslint-disable-line no-unused-vars
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

      const versionsModel = sequelize.define('Versions', { // eslint-disable-line no-unused-vars
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

      const commandsActivitiesModel = sequelize.define('CommandsActivities', { // eslint-disable-line no-unused-vars
         id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
         },
         commandName: DataTypes.STRING(10)
      });

      // Relations
      usersModel.hasMany(notificationsModel, { foreignKey: 'userId' });
      usersModel.hasOne(subscriptionsModel, { foreignKey: 'userId' });
      usersModel.hasMany(commandsActivitiesModel, { foreignKey: 'userId' });

      subscriptionsModel.hasMany(notificationsModel, { foreignKey: 'subscriptionId' });
      subscriptionsModel.belongsTo(usersModel, { foreignKey: 'userId' });

      notificationsModel.belongsTo(subscriptionsModel, { foreignKey: 'subscriptionId' });
      notificationsModel.belongsTo(usersModel, { foreignKey: 'userId' });

      quizzQuestionsModel.hasMany(quizzAnswersModel, { foreignKey: 'questionId' });
      quizzAnswersModel.belongsTo(quizzQuestionsModel, { foreignKey: 'questionId' });

      guildsModel.hasMany(commandsActivitiesModel, {
         foreignKey: {
            name: 'guildId',
            allowNull: true
         }
      });

      commandsActivitiesModel.belongsTo(guildsModel, {
         foreignKey: {
            name: 'guildId',
            allowNull: true
         }
      });
      commandsActivitiesModel.belongsTo(usersModel, { foreignKey: 'userId' });

      // Sync
      // if (process.env.NODE_ENV != 'production') {
      //    await sequelize.sync({ match: /.*_dev$/ });
      // }
   },

   // Models
   usersModel: () => sequelize.models.Users,
   subscriptionsModel: () => sequelize.models.Subscriptions,
   notificationsModel: () => sequelize.models.Notifications,
   guildsModel: () => sequelize.models.Guilds,
   quizzQuestionsModel: () => sequelize.models.QuizzQuestions,
   quizzAnswersModel: () => sequelize.models.QuizzAnswers,
   versionsModel: () => sequelize.models.Versions,
   commandsActivitiesModel: () => sequelize.models.CommandsActivities,
};