const { Routes } = require('discord.js')

module.exports.initializationClient = async (client, rest, discordToken, clientId, allCommands) => {
    try {
        console.log('Started refreshing application (/) commands.');
        const commands = allCommands.map(command => { return { name: command.name, description: command.description, options: command.options } })
        await rest.put(Routes.applicationCommands(clientId), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
    });
    
    client.login(discordToken);
}