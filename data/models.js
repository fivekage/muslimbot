const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();
const logger = require('../utils/logger.js')

const sequelizeInstance = () => {
    const DB_HOST = process.env.DB_HOST
    const DB_DATABASE = process.env.DB_DATABASE ?? 'muslimbot'
    const DB_USERNAME = process.env.DB_USERNAME
    const DB_PASSWORD = process.env.DB_PASSWORD

    if (!DB_HOST || !DB_USERNAME || !DB_PASSWORD) {
        console.error("Please provide a valid db host, username and password")
        process.exit(1)
    }

    logger.info("Database Used :", DB_DATABASE)

    const connectionStr = `mariadb://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}/${DB_DATABASE}`
    return new Sequelize(connectionStr, {
        host: DB_HOST,
        database: DB_DATABASE,
        username: DB_USERNAME,
        password: DB_PASSWORD,
        dialect: 'mariadb'
    });
};

const sequelize = sequelizeInstance()
module.exports.init = async () => {
    try {
        await sequelize.authenticate();
        logger.info('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
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
    });

    const Notifications = sequelize.define('Notifications', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        prayer: DataTypes.STRING,
    });

    Users.hasOne(Subscriptions);
    Subscriptions.belongsTo(Users)

    Users.hasMany(Notifications);
    Notifications.belongsTo(Users)
    Subscriptions.hasMany(Notifications);
    Notifications.belongsTo(Subscriptions)

    if (process.env.NODE_ENV != "production") {
        await sequelize.sync({ benchmark: true, match: /.*_dev$/ })
    }

    await Users.sync({ benchmark: true })
    await Subscriptions.sync({ benchmark: true })
    await Notifications.sync({ benchmark: true })

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