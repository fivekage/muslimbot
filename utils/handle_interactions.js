module.exports.handleInteraction = async (client, commands) => {
    client.on('interactionCreate', async interaction => {
        if (!interaction.isChatInputCommand()) return;

        if(commands.some((command) => command.name == interaction.commandName)) {
            try {
                const command = commands.find((command) => command.name == interaction.commandName);
                if(!command) await interaction.reply({ content: 'This command does not exist', ephemeral: true });

                commands.find((command) => command.name == interaction.commandName).file.run(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    })
}