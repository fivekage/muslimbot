
const { commandsActivitiesModel, usersModel, guildsModel } = require('../data/models');
const logger = require('./logger');

module.exports.trackCommandActivities = async (interaction) => {
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
      defaults: { userId: interaction.user.id, guildId: interaction.guild.id, subscribedChangelog: true }
   });
   if (created) {
      logger.info(`New user ${user.userId} created during command ${interaction.commandName}`);
   }

   commandsActivities.create({
      commandName: interaction.commandName,
      userId: user.id,
      guildId: guild ? guild.id : null,
   });
}