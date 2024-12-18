const { Events } = require('discord.js');
const logger = require('../utils/logger');
const { trackCommandActivities } = require('../utils/track_commands_activities');
module.exports.handleInteraction = async (client, commands) => {
   client.on(Events.InteractionCreate, async (interaction) => {
      // Track command activities
      try {
         await trackCommandActivities(interaction);
      } catch (error) {
         logger.warn(error);
      }

      // Handle slash commands
      if (interaction.isChatInputCommand()) {
         if (commands.some((command) => command.name == interaction.commandName)) {
            try {
               const command = commands.find((command) => command.name == interaction.commandName);
               if (!command) await interaction.reply({ content: 'This command does not exist', ephemeral: true });

               commands.find((command) => command.name == interaction.commandName).file.run(client, interaction);
            } catch (error) {
               logger.fatal(error);
               await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
         }
      }

      // Handle autocomplete
      if (interaction.isAutocomplete()) {
         if (commands.some((command) => command.name == interaction.commandName)) {
            const command = commands.find((command) => command.name == interaction.commandName);
            if (!command) await interaction.reply({ content: 'This command does not allow autocomplete', ephemeral: true });
            try {
               await command.file.autocomplete(interaction);
            } catch (error) {
               logger.fatal(error);
            }
         }
      }
   });
};


