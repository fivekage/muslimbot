const { EmbedBuilder, MessageFlags } = require('discord.js');
const logger = require('../../utils/logger.js');
const vars = require('../_general/vars.js');
const { AladhanAPI } = require('../../apis/aladhan_api.js');

module.exports.help = {
   name: 'events',
   description: 'Provides information about today’s Islamic events and upcoming ones',
};

module.exports.run = async (_client, interaction) => {

   await interaction.deferReply();
   const aladhanAPIObj = new AladhanAPI(3);

   try {
      const islamicCurrentDay = await aladhanAPIObj.getIslamicCurrentDay();
      const islamicEvents = await aladhanAPIObj.getIslamicUpcomingEvents();

      const currentDate = islamicCurrentDay?.date || 'Unknown date';

      const currentHolidays =
         islamicCurrentDay?.holidays?.length > 0
            ? islamicCurrentDay.holidays.map(h => `• ${h}`).join('\n')
            : 'No special event today 🤍';

      const upcomingEvents =
         islamicEvents?.length > 0
            ? islamicEvents
               .slice(0, 8)
               .map(event => `• **${event.holidays.join(' ')}**\n  └ 📅 ${event.readableDate}`)
               .join('\n\n')
            : 'No upcoming events found.';

      const embed = new EmbedBuilder()
         .setColor(vars.primaryColor)
         .setTitle('☪️ Islamic Events')
         .setDescription(`📅 **Islamic Date:** ${currentDate}\n\nHere are today’s events and the upcoming ones for the next ${aladhanAPIObj.maxMonthsUpcomingEvents} months.`)
         .addFields(
            {
               name: '🌙 Today',
               value: currentHolidays,
               inline: false,
            },
            {
               name: '📌 Upcoming Events',
               value: upcomingEvents,
               inline: false,
            }
         )
         .setFooter({ text: vars.footerText })
         .setTimestamp();

      return interaction.editReply({ embeds: [embed] });

   } catch (error) {
      logger.error(error);
      return interaction.editReply({
         embeds: [
            new EmbedBuilder()
               .setColor(vars.errorColor)
               .setTitle('❌ Error')
               .setDescription('An error occurred while retrieving Islamic events. Please try again later.')
         ],
         flags: MessageFlags.Ephemeral
      });
   }
};