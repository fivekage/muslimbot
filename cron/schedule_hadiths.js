const schedule = require('node-schedule');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { guildsModel } = require('../data/models.js');
const logger = require('../utils/logger.js');
const vars = require('../commands/_general/vars.js');

const rule = new schedule.RecurrenceRule();

const hadithAPIUrl = process.env.HADITH_API_URL;
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
      let hadithOk = false;
      let hadith = null;
      while (!hadithOk) {
         try {
            hadith = await getRandomHadith();
            if (hadith.hadith_english && hadith.hadith_english.length < 1024) { // Discord embed limit
               hadithOk = true;
            }
         } catch (error) {
            logger.error('Error during retrieve hadith', error);
            return;
         }
         logger.debug('Hadith length', hadith.hadith_english.length);
      }

      // Send hadith to all guilds
      guilds.findAll({ where: { dailyHadithEnabled: 1 } }).then((guildsFiltered) => {
         guildsFiltered.forEach(async (guild) => {
            const guildFetched = await client.guilds.fetch(guild.guildId).catch(() => {
               logger.error(`Error during fetch guild ${guild.guildId}, notifications will be disabled for this guild`);
               guild.isStillInGuild = false;
               guild.save();
            });

            let channel = guildFetched?.channels.cache.find((channel) => channel.id == guild.channelAnnouncementId);
            // Fetch channels which bot can send messages

            if (guild.channelAnnouncementId === NOT_CONFIGURED_CHANNEL || !channel) {
               channel = guildFetched?.channels.cache.find((channel) => channel.type == 0 && guildFetched.members.me.permissionsIn(channel.id).has(PermissionsBitField.Flags.SendMessages));
            }

            if (!channel) {
               logger.warn('No channel to send the hadith in guild', guild.guildId);
               return;
            }
            if (!guildFetched.members.me.permissionsIn(channel.id).has(PermissionsBitField.Flags.SendMessages)) {
               logger.warn(`Bot doesn't have the permission to send messages in channel [${channel.name}] for guild [${guildFetched.name}]`);

               notifyAdministratorFromMissingChannel(guilds, guild, guildFetched, channel).catch((error) => {
                  logger.error('Error during notify administrator from missing channel', error);
               });
               return;
            }

            logger.info(`Sending hadith to guild ${guild.guildId}`);

            const hadithBook = hadith.book.replace('`', '');
            const hadithChapterName = hadith.chapterName.replace('`', '');
            const hadithBookName = hadith.bookName.replace(/[\t\n]/g, '');
            const hadithText = hadith.hadith_english.replace('`', '').trim().replace(/[\t\n]/g, '').replace('“', '')
               .replace('”', '');
            const hadithHeader = hadith.header?.replace('`', '').replace('\n', '') ?? '\u200B';

            try {
               const replyEmbed = new EmbedBuilder()
                  .setTitle('Hadith of the day')
                  .setDescription(hadithHeader)
                  .addFields([
                     {
                        name: `From : ${hadithBook} - ${hadithBookName}`,
                        value: hadithChapterName,
                     },
                     {
                        name: '\u200B',
                        value: `“*${hadithText}*”`,
                     },
                     {
                        name: '\u200B',
                        value: hadith.refno,
                     },
                  ])
                  .setColor(vars.primaryColor)
                  .setThumbnail('https://i.imgur.com/DCFtkTv.png')
                  .setFooter({
                     text:
                        !guild.channelAnnouncementId ? 'You can configure a channel to receive theses hadith with /hadith command' :
                           'MuslimBot 🕋 - For any help type /help command',
                  });

               channel.send({ embeds: [replyEmbed] }).catch((error) => {
                  logger.error(`Error during send hadith for guild ${guild.guildId}`, error);
               });
               logger.info(`Hadith sent to guild ${guild.guildId}`);
            } catch (error) {
               logger.fatal('Error during create embed for hadith', error);
            }
         });
         logger.info(`Hadith sent to ${guilds.length} guilds`);
      });
   });

   logger.info(`Job Schedule Hadiths ${job.name} scheduled at ${job.nextInvocation()}`);
};

const getRandomHadith = async () => {
   const hadithBook = hadithsBooks[Math.floor(Math.random() * hadithsBooks.length)];

   const API_ENDPOINT_HADITH = `${hadithAPIUrl}${hadithBook}`;
   try {
      const response = await fetch(API_ENDPOINT_HADITH);
      const data = await response.json();
      logger.info('Hadih retrieved successfully from API');
      return data.data;
   } catch (error) {
      logger.error('Error during retrieve hadith', error);
      throw error;
   }
};

const hadithsBooks = [
   'bukhari', 'muslim', 'abudawud', 'ibnmajah', 'tirmidhi',
];

const notifyAdministratorFromMissingChannel = async (guildsTable, guildEntity, guildFetched, channel) => {
   const admin = await guildFetched.fetchOwner().catch(() => {
      throw Error(`Error during fetch owner guild ${guildFetched.name}`);
   });

   if (admin) {
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
   }
};

module.exports = {
   dailyCallScheduleHadiths,
};
