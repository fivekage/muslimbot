const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();
const logger = require('../utils/logger.js')

const sequelizeInstance = () => {
    const DB_HOST = process.env.DB_HOST
    const DB_DATABASE = process.env.DB_DATABASE ?? 'muslimbot'
    const DB_USERNAME = process.env.DB_USERNAME
    const DB_PASSWORD = process.env.DB_PASSWORD

    if (!DB_HOST || !DB_USERNAME || !DB_PASSWORD) {
        logger.fatal("Please provide a valid db host, username and password")
        process.exit(1)
    }

    logger.info("Database Used :", DB_DATABASE)

    const connectionStr = `mariadb://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}/${DB_DATABASE}`
    return new Sequelize(connectionStr, {
        host: DB_HOST,
        database: DB_DATABASE,
        username: DB_USERNAME,
        password: DB_PASSWORD,
        dialect: 'mariadb',
        dialectModule: require('mariadb'),
        benchmark: true,  // <-- this one enables tracking execution time
        logging: (sql, timingMs) => { timingMs > 10 ?? logger.debug(`${sql} - [Execution time: ${timingMs}ms]`) } // Log only if query time is greater than 10ms
    });
};

const sequelize = sequelizeInstance()
module.exports.init = async (client) => {
    try {
        await sequelize.authenticate();
        logger.info('Connection has been established successfully.');
    } catch (error) {
        logger.fatal('Unable to connect to the database:', error);
        throw error
    }

    const Users = sequelize.define('Users', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        userId: {
            type: DataTypes.STRING,
            unique: true,
        },
        guildId: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    });

    const Subscriptions = sequelize.define('Subscriptions', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        city: DataTypes.STRING,
        country: DataTypes.STRING,
        subscriptionEnabled: DataTypes.BOOLEAN,
    }, {
        hooks: {
            afterCreate: async (subscription, options) => {
                const { schedulePrayerNewSubscription } = require('../utils/schedule_notifications.js')
                schedulePrayerNewSubscription(client, subscription)
            },
        }
    });

    const Notifications = sequelize.define('Notifications', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        prayer: DataTypes.STRING,
        sent: DataTypes.BOOLEAN,
    });

    const Guilds = sequelize.define('Guilds', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        guildId: DataTypes.STRING,
        guildName: DataTypes.STRING,
        dailyHadithEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        }
    });

    const QuizzQuestions = sequelize.define('QuizzQuestions', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        question: DataTypes.STRING,
        enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        }
    });

    const QuizzAnswers = sequelize.define('QuizzAnswers', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        valid: DataTypes.BOOLEAN,
        answer: DataTypes.STRING,
        enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        }
    });

    Users.hasOne(Subscriptions);
    Subscriptions.belongsTo(Users)

    Users.hasMany(Notifications);
    Notifications.belongsTo(Users)
    Subscriptions.hasMany(Notifications);
    Notifications.belongsTo(Subscriptions);
    QuizzQuestions.hasMany(QuizzAnswers);
    QuizzAnswers.belongsTo(QuizzQuestions);

    if (process.env.NODE_ENV != "production") {
        await sequelize.sync({ match: /.*_dev$/ })
    }

    await Users.sync()
    await Subscriptions.sync()
    await Notifications.sync()
    await Guilds.sync()
    await QuizzQuestions.sync()
    await QuizzAnswers.sync()

}

module.exports.Users = () => {
    return sequelize.models["Users"]
}

module.exports.Subscriptions = () => {
    return sequelize.models["Subscriptions"]
}

module.exports.Notifications = () => {
    return sequelize.models["Notifications"]
}

module.exports.Guilds = () => {
    return sequelize.models["Guilds"]
}

module.exports.QuizzQuestions = () => {
    return sequelize.models["QuizzQuestions"]
}

module.exports.QuizzAnswers = () => {
    return sequelize.models["QuizzAnswers"]
}