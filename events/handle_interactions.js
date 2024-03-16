const {Events} = require('discord.js');
const logger = require('../utils/logger');

module.exports.handleInteraction = async (client, commands) => {
	client.on(Events.InteractionCreate, async (interaction) => {
		if (interaction.isUserContextMenuCommand()) {
			// Get the User's username from context menu
			const {username} = interaction.targetUser;
			console.log(username);
		}

		if (!interaction.isChatInputCommand()) return;

		if (commands.some((command) => command.name == interaction.commandName)) {
			try {
				const command = commands.find((command) => command.name == interaction.commandName);
				if (!command) await interaction.reply({content: 'This command does not exist', ephemeral: true});

				commands.find((command) => command.name == interaction.commandName).file.run(client, interaction);
			} catch (error) {
				logger.fatal(error);
				await interaction.reply({content: 'There was an error while executing this command!', ephemeral: true});
			}
		}
	});
};
