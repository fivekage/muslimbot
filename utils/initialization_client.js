const { Routes } = require('discord.js')
const logger  = require('./logger.js')

module.exports.initializationClient = async (client, rest, discordToken, clientId, allCommands) => {
    try {
        logger.info('Started refreshing application (/) commands.');
        const commands = allCommands.map(command => { return { 
            name: command.name, 
            description: command.description, 
            options: command.options,
            choices: command.choices
         } })
        await rest.put(Routes.applicationCommands(clientId), { body: commands });
        logger.info('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
    client.on('ready', () => {
        logger.info(`Logged in as ${client.user.tag}!`);
    });
    
    client.login(discordToken);
}