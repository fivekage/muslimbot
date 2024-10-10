const {
   EmbedBuilder,
} = require('discord.js');
const logger = require('../../utils/logger.js');
const vars = require('../_general/vars.js');
const { AladhanAPI } = require('../../utils/aladhan_api.js');


module.exports.help = {
   name: 'events',
   description: 'Provides information on the day\'s events and those to come',
};

module.exports.run = async (_client, interaction) => {

   await interaction.deferReply({ ephemeral: true });
   const aladhanAPIObj = new AladhanAPI(3);

   try {
      const islamicCurrentDay = await aladhanAPIObj.getIslamicCurrentDay()

      // Check if the date has an event, if yes, push it in the events array
      const islamicEvents = await aladhanAPIObj.getIslamicUpcomingEvents();
      const currentHolidays = islamicCurrentDay?.holidays?.length > 0 ? islamicCurrentDay?.holidays?.join('\n') : 'No event today';

      const upcomingEvents = islamicEvents.length > 0 ? islamicEvents.map((event) => `• ${event.holidays.join(' ')} - ${event.readableDate}`).join('\n') : 'No upcoming events';
      const embed = new EmbedBuilder()
         .setTitle(`Islamic Date: ${islamicCurrentDay.date} ☪️`)
         .setDescription(`Here are the Islamic events for today and the next ${aladhanAPIObj.max_months_upcoming_events} months`)
         .setColor(vars.primaryColor)
         .addFields([
            {
               name: '\u200B',
               value: currentHolidays.toString(),
            },
            {
               name: 'Upcoming Events:',
               value: upcomingEvents
            }
         ]
         )
         .setTimestamp()
         .setFooter({ text: vars.footerText })

      return interaction.editReply({ embeds: [embed], ephemeral: false });
   } catch (error) {
      logger.error(error);
      return interaction.editReply({ content: 'An error occured while retrieving current day and upcoming events', ephemeral: true });
   }

};
