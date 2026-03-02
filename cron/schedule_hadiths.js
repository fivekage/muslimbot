const schedule = require('node-schedule');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { guildsModel } = require('../data/models.js');
const logger = require('../utils/logger.js');
const vars = require('../commands/_general/vars.js');
const { HadithsAPI } = require('../apis/hadiths_api.js');
const { formatText } = require('../utils/string_utils.js');

const rule = new schedule.RecurrenceRule();

const NOT_CONFIGURED_CHANNEL = 'NOT_CONFIGURED_CHANNEL';

const dailyCallScheduleHadiths = (client) => {
   if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV === 'development') {
      logger.info('Hadiths schedule in development mode');

      rule.hour = process.env.HADITH_SCHEDULE_HOUR ?? 10;
      rule.minute = process.env.HADITH_SCHEDULE_MINUTE ?? 0;
   } else {
      rule.hour = process.env.HADITH_SCHEDULE_HOUR ?? 10;
      rule.minute = process.env.HADITH_SCHEDULE_MINUTE ?? 0;
   }
   rule.tz = 'Etc/UTC';

   const job = schedule.scheduleJob(rule, async () => {
      const guilds = guildsModel();
      // Fetch hadith
      const hadithsAPI = new HadithsAPI();
      const hadith = await hadithsAPI.getRandomHadith(10).catch((error) => {
         logger.error('Error during retrieve hadith', error);
         return;
      });
      if (!hadith) {
         logger.error('Hadith not found, stopping job');
         return;
      }

      // Send hadith to all guilds
      guilds.findAll({ where: { dailyHadithEnabled: 1, isStillInGuild: true } }).then((guildsFiltered) => {
         guildsFiltered.forEach(async (guild) => {
            const guildFetched = await client.guilds.fetch(guild.guildId).catch(() => {
               logger.error(`Error during fetch guild ${guild.guildName}, notifications will be disabled for this guild`);
               guild.isStillInGuild = false;
               guild.save();
            });

            let channel = guildFetched?.channels.cache.find((channel) => channel.id == guild.channelAnnouncementId);
            // Fetch channels which bot can send messages

            if (guild.channelAnnouncementId === NOT_CONFIGURED_CHANNEL || !channel) {
               channel = guildFetched?.channels.cache.find((channel) => channel.type == 0 && guildFetched.members.me.permissionsIn(channel.id).has(PermissionsBitField.Flags.SendMessages));
            }

            if (!channel) {
               logger.warn('No channel to send the hadith in guild', guild.guildName);
               return;
            }
            if (!guildFetched.members.me.permissionsIn(channel.id).has(PermissionsBitField.Flags.SendMessages)) {
               logger.warn(`Bot doesn't have the permission to send messages in channel [${channel.name}] for guild [${guildFetched.name}]`);

               notifyAdministratorFromMissingChannel(guilds, guild, guildFetched, channel).catch((error) => {
                  logger.error('Error during notify administrator from missing channel', error);
               });
               return;
            }

            logger.info(`Sending hadith to guild ${guild.guildName}`);

            const englishEmbed = new EmbedBuilder()
               .setTitle(`🇬🇧 Hadith from ${formatText(hadith.book.bookName)} - ${formatText(hadith.book.writerName)}`)
               .addFields([
                  {
                     name: `Chapter Name`,
                     value: formatText(hadith.chapter.chapterEnglish),
                     inline: true,
                  }
               ])
               .setDescription(`${formatText(hadith.hadithEnglish)}`)
               .setColor(vars.primaryColor)
               .setFooter({
                  iconURL: 'https://i.imgur.com/DCFtkTv.png',
                  text:
                     !guild.channelAnnouncementId ? 'You can configure a channel to receive theses hadith with /hadith command' :
                        `${vars.footerText}`
               });
            const arabicEmbed = new EmbedBuilder()
               .setTitle(`🇸🇦 Hadith from ${formatText(hadith.book.bookName)} - ${formatText(hadith.book.writerName)}`)
               .addFields([
                  {
                     name: `Chapter Name`,
                     value: formatText(hadith.chapter.chapterArabic),
                     inline: true,
                  }
               ])
               .setDescription(`
                     ${formatText(hadith.hadithArabic)}
                  `)
               .setColor(vars.primaryColor)
               .setFooter({
                  text: `${vars.footerText}`, iconURL: 'https://i.imgur.com/DCFtkTv.png'
               })
               .setFooter({
                  iconURL: 'https://i.imgur.com/DCFtkTv.png',
                  text:
                     !guild.channelAnnouncementId ? 'You can configure a channel to receive theses hadith with /hadith command' :
                        `${vars.footerText}`
               });

            channel.send({ embeds: [englishEmbed, arabicEmbed] }).catch((error) => {
               // If error, notify administrator and disable hadith
               logger.error(`Error during send hadith for guild ${guild.guildName}`, error);
               notifyAdministratorFromMissingChannel(guilds, guild, guildFetched, channel).catch((error) => {
                  logger.error('Error during notify administrator from missing channel', error);
               });
               guild.isStillInGuild = false;
               guild.save();
            });
            logger.info(`Hadith sent to guild ${guild.guildName}`);
         });
         logger.info(`Hadith sent to ${guilds.length} guilds`);
      });
   });

   logger.info(`Job Schedule Hadiths ${job.name} scheduled at ${job.nextInvocation()}`);
};

const notifyAdministratorFromMissingChannel = async (guildsTable, guildEntity, guildFetched, channel) => {
   const admin = await guildFetched.fetchOwner().catch(() => {
      throw Error(`Error during fetch owner guild ${guildFetched.name}`);
   });

   if (!admin) {
      logger.error(`Error during fetch owner guild ${guildFetched.name}`);
      return;
   }
   const embed = new EmbedBuilder()
      .addFields([
         {
            name: 'For your information',
            value: `No channel to send the hadith in your guild <${guildFetched.name}>, please configure a channel with \`/hadith\` command`,
         },
         {
            name: 'Or',
            value: `Give me the permission to send messages in the channel <#${channel.id}>`,
         },
         {
            name: 'Also, you can',
            value: 'You can kick me and invite me again, MuslimBot will automatically create a channel to send the hadiths',
         },
         {
            name: 'Otherwise',
            value: 'If you dont wan\'t to receive the hadiths, you can disable it with `/hadith` command',
         },
      ])
      .setAuthor({ name: 'MuslimBot' })
      .setColor(vars.primaryColor)
      .setFooter({ text: `${require('../package.json').version} - MuslimBot 🕋 - For any help type /help command` });

   admin.send({ embeds: [embed] });
   guildsTable.update({ channelAnnouncementId: NOT_CONFIGURED_CHANNEL }, { where: { guildId: guildEntity.guildId } });

};

module.exports = {
   dailyCallScheduleHadiths,
};
