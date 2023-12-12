const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelizeInstance = () => {
    const DB_HOST = process.env.DB_HOST
    const DB_USERNAME = process.env.DB_USERNAME
    const DB_PASSWORD = process.env.DB_PASSWORD

    if (!DB_HOST || !DB_USERNAME || !DB_PASSWORD) {
        console.error("Please provide a valid db host, username and password")
        process.exit(1)
    }

    console.log("Database Host :", DB_HOST)
    console.log("Database Username", DB_USERNAME)
    const connectionStr = `mariadb://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}/muslimbot`
    return new Sequelize(connectionStr, {
        host: DB_HOST,
        database: 'muslimbot',
        username: DB_USERNAME,
        password: DB_PASSWORD,
        dialect: 'mariadb'
    });
};

const sequelize = sequelizeInstance()
module.exports.init = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
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
    });

    const Subscriptions = sequelize.define('Subscriptions', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        city: DataTypes.STRING,
        subscriptionEnabled: DataTypes.BOOLEAN,
    });

    Users.hasOne(Subscriptions);

    await Users.sync({ alter: true, benchmark: true})
    await Subscriptions.sync({ alter: true, benchmark: true})
}

module.exports.Users = () => {
    return sequelize.models["Users"]
}

module.exports.Subscriptions = () => {
    return sequelize.models["Subscriptions"]
}