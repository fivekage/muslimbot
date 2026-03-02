const { EmbedBuilder, MessageFlags } = require('discord.js');
const logger = require('../../utils/logger.js');
const { usersModel } = require('../../data/models.js');
const vars = require('../_general/vars.js');

module.exports.help = {
   name: 'release_notes',
   description: 'Subscribe or unsubscribe to release notes',
   options: [
      {
         name: 'enable',
         description: 'Enable or disable release notes',
         type: 5,
         required: true,
         choices: [
            { name: 'Enable', value: true },
            { name: 'Disable', value: false },
         ],
      },
   ],
};

module.exports.run = async (_client, interaction) => {

   await interaction.deferReply({ flags: MessageFlags.Ephemeral });

   try {
      const value = interaction.options.getBoolean('enable');

      const [user] = await usersModel().findOrCreate({
         where: { userId: interaction.user.id },
         defaults: {
            userId: interaction.user.id,
            subscribedChangelog: value,
         },
      });

      user.subscribedChangelog = value;
      await user.save();

      const embed = new EmbedBuilder()
         .setColor(value ? vars.greenColor : vars.redColor)
         .setTitle(value ? '📢 Release Notes Enabled' : '🔕 Release Notes Disabled')
         .setDescription(
            value
               ? 'You will now receive updates about new features and improvements.'
               : 'You will no longer receive release note notifications.'
         )
         .setFooter({ text: 'MuslimBot • Stay informed 🤍' })
         .setTimestamp();

      return interaction.editReply({ embeds: [embed] });

   } catch (error) {
      logger.error(error);

      return interaction.editReply({
         embeds: [
            new EmbedBuilder()
               .setColor(vars.errorColor)
               .setTitle('❌ Error')
               .setDescription('Something went wrong. Please try again later.')
         ]
      });
   }
};