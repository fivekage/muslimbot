const { EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const logger = require('../utils/logger.js');
const { guildsModel } = require('../data/models.js');
const vars = require('../commands/_general/vars.js');
const { Events } = require('discord.js');

module.exports.handleNewGuild = async (client) => {
   client.on(Events.GuildCreate, async (guild) => {
      logger.info(`Joined a new guild: ${guild.name} (${guild.id}). This guild has ${guild.memberCount} members!`);

      if (!guild.available) {
         logger.warn(`Guild ${guild.name} is not available`);
         return;
      }

      const guilds = guildsModel();
      const channelName = 'hadiths';
      await guild.channels.create({
         name: channelName,
         type: ChannelType.GuildText,
         permissionOverwrites: [
            {
               id: guild.id,
               allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.AddReactions,
                  PermissionsBitField.Flags.SendMessages,
                  PermissionsBitField.Flags.EmbedLinks
               ],
            },
         ],
      });

      const channelHadiths = guild.channels.cache.find((channelHadiths) => channelHadiths.name == channelName);

      await guilds.findOrCreate({
         where: { guildId: guild.id },
         defaults: {
            guildName: guild.name,
            dailyHadithEnabled: true,
            isStillInGuild: true,
            channelAnnouncementId: channelHadiths.id,
         },
      });

      let channelWelcome = guild.channels.cache.find((channel) => channel.type == 0);

      if (!channelWelcome) {
         logger.warn('No channelHadiths to send the welcome message');
         channelWelcome = channelHadiths;
      }

      if (!guild.members.me.permissionsIn(channelWelcome.id).has(PermissionsBitField.Flags.SendMessages)) {
         logger.warn(`Guild ${guild.name} doesn't have the permission to send messages in channel ${channelHadiths.name}`);
         channelWelcome = channelHadiths;
      }
      const welcomeEmbed = new EmbedBuilder()
         .setTitle('Assalamu alaykum 🙏')
         .setDescription('Get started with MuslimBot to receive prayer notifications and hadiths')
         .setAuthor({ name: 'Samy' })
         .setColor(vars.primaryColor)
         .setImage('https://i.imgur.com/e0JyEKJ.jpeg')
         .addFields([
            {
               name: 'About',
               value: `MuslimBot is a Discord bot that sends prayer notifications and hadiths to your server and DMs. It is open source and you can contribute to it on [GitHub](${vars.githubUrl})`,
            },
            {
               name: 'Commands',
               value: 'Type `/help` to get a list of available commands',
            },
            {
               name: 'Support',
               value: 'If you have any questions or suggestions, please send me a message <@317033647045607424>)',
            },
            {
               name: 'Donation',
               value: `You can [donate](${vars.paypalDonationUrl}) to support the development of MuslimBot`,
            }
         ])
         .setFooter({ text: `${require('../package.json').version} - MuslimBot 🕋 - For any help type /help command` });

      const hadithEmbed = new EmbedBuilder()
         .setTitle('Hadith of the day')
         .setDescription('Get a new hadith every day')
         .setAuthor({ name: 'Samy' })
         .setColor(vars.primaryColor)
         .setImage('https://cdn-icons-png.flaticon.com/512/5003/5003126.png')
         .addFields([
            {
               name: 'Hadith of the day',
               value: 'Hadiths are already enabled in this channel. Type `/hadith` to configure another channel to get a new hadith every day',
            },

         ])
         .setFooter({ text: `${require('../package.json').version} - MuslimBot 🕋 - For any help type /help command` });

      channelHadiths.send({ embeds: [hadithEmbed] });
      channelWelcome.send({ embeds: [welcomeEmbed] });
   });
};
