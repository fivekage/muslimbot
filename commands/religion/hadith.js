const { EmbedBuilder, ApplicationCommandOptionType, ChannelType, PermissionsBitField } = require('discord.js');
const { guildsModel } = require('../../data/models');
const logger = require('../../utils/logger.js');
const vars = require('../_general/vars.js');

module.exports.help = {
   name: 'hadith',
   description: 'Enable or disable daily hadiths',
   options: [
      {
         name: 'enable',
         description: 'Enable (True) or disable (False) daily hadiths',
         type: 5,
         required: true,
         choices: [
            {
               name: 'Enable',
               value: true,
            },
            {
               name: 'Disable',
               value: false,
            },
         ],
      },
      {
         name: 'channel',
         description: 'Select channel where to send daily hadiths',
         required: false,
         type: ApplicationCommandOptionType.Channel,
         channel_types: [
            ChannelType.GroupDM,
            ChannelType.GuildText,
            ChannelType.GuildAnnouncement,
         ],
      },
   ],
};

module.exports.run = async (client, interaction) => {
   // Check whether the command was executed in a server
   if (!interaction.inGuild()) {
      return interaction.reply({
         content: 'This command is only available in a server',
         ephemeral: true,
      });
   }

   // Get the value of the option "enable"
   const hadithEnabled = interaction.options.getBoolean(this.help.options[0].name);
   if (hadithEnabled === null) {
      return interaction.reply({
         content: 'You must specify if you want to enable or disable daily hadiths',
         ephemeral: true,
      });
   }

   // Get the value of the option "channel", check if the option is null if the hadiths are enabled
   const channelSelected = interaction.options.getChannel(this.help.options[1].name);
   if (hadithEnabled && channelSelected === null) {
      return interaction.reply({
         content: 'You must specify a channel where to send daily hadiths',
         ephemeral: true,
      });
   }

   // Fetch Guild,  if doesn't exists, create one
   const [guild, created] = await guildsModel().findOrBuild({
      where: { guildId: interaction.guild.id },
      defaults: {
         guildName: interaction.guild.name,
      },
   }).catch((error) => {
      logger.error(`Error while fetching guild ${interaction.guild.id} - ${error}`);
      return interaction.reply({
         content: 'An error occurred while fetching the guild',
         ephemeral: true,
      });
   });
   if (created) {
      logger.info('Guild created for', interaction.user.username);
   } else {
      logger.info(`Guild ${interaction.guild.id} already exists for`);
   }

   // Check if the bot has the permission to send messages in the channel
   const guildFetched = await client.guilds.fetch(interaction.guild.id);
   if (hadithEnabled && !guildFetched.members.me.permissionsIn(channelSelected.id).has(PermissionsBitField.Flags.SendMessages)) {
      const embed = new EmbedBuilder()
         .setTitle('I am not able to enable daily hadiths in this channel')
         .addFields([
            { name: 'What\'s happening?', value: 'I don\'t have permissions to send messages in the selected channel' },
            { name: 'What to do?', value: 'Try to kick and reinvite the bot to your server, if it didn\'t work, please contact me <@317033647045607424>' },
         ])
         .setColor(vars.errorColor)
         .setFooter({ text: 'MuslimBot 🕋 - For any help type /help command' });
      return interaction.reply({ embeds: [embed] });
   }

   // Save the new value in the database
   guild.dailyHadithEnabled = hadithEnabled;
   guild.channelAnnouncementId = channelSelected?.id;
   await guild.save();
   logger.info(`Hadiths option has been changed with ${hadithEnabled} value for guild ${interaction.guild.id}`);

   // Send a message to the user
   const embed = new EmbedBuilder()
      .setTitle('Hadith of the day')
      .setDescription(hadithEnabled ?
         'Hadiths are now enabled, you will receive a hadith in your server everyday' :
         'Hadiths are now disabled')
      .setColor(vars.primaryColor)
      .setFooter({ text: 'MuslimBot 🕋 - For any help type /help command' });

   interaction.reply({ embeds: [embed] });
};
