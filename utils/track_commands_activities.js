
const { commandsActivitiesModel, usersModel, guildsModel } = require('../data/models');
const logger = require('./logger');

module.exports.trackCommandActivities = async (interaction) => {
   // ✅ Track uniquement les slash commands
   if (!interaction.isChatInputCommand()) {
      logger.warn(`Interaction ${interaction.id} is not a chat input command, skipping tracking...`);
      return;
   }
   logger.info(`Tracking command activity for command ${interaction.commandName} by user ${interaction.user.id} in guild ${interaction.guild?.id || 'DM'}`);

   const commandsActivities = commandsActivitiesModel();
   let guild = null;
   if (interaction.inGuild()) {
      guild = await guildsModel().findOne({ where: { guildId: interaction.guild.id } });
      if (!guild) {
         throw new Error(`Guild not found for guild : ${interaction.guild.name}`);
      }
   }

   let [user, created] = await usersModel().findOrCreate({
      where: { userId: interaction.user.id },
      defaults: { userId: interaction.user.id, guildId: interaction?.guild?.id, subscribedChangelog: true }
   });
   if (created) {
      logger.info(`New user ${user.userId} created during command ${interaction.commandName}`);
   }

   if (!interaction.commandName || !user.id) {
      logger.warn(`Command name <${interaction.comman > dName} or user ID <${user.id}> is missing for interaction: ${interaction.id}, skipping tracking...`);
      return;
   }
   commandsActivities.create({
      commandName: interaction.commandName,
      userId: user.id,
      guildId: guild ? guild.id : null,
   });
}