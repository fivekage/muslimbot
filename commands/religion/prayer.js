const { EmbedBuilder, ApplicationCommandOptionType, MessageFlags } = require('discord.js');
const vars = require('../_general/vars.js');
const logger = require('../../utils/logger.js');
const { retrievePrayersOfTheDay } = require('../../utils/retrieve_prayers.js');
const { CountriesAPI } = require('../../apis/countries_api.js');

const countriesAPI = new CountriesAPI();
(async () => {
   await countriesAPI.initialize(); // Pre-fetch countries data
})();
const COUNTRY_PARAM_NAME = 'country';
const CITY_PARAM_NAME = 'city';

module.exports.help = {
   name: 'prayer',
   description: 'Returns the times of each Muslim prayer according to the desired city',
   options: [
      {
         name: COUNTRY_PARAM_NAME,
         description: 'The country you want to know the prayer times',
         type: ApplicationCommandOptionType.String,
         required: true,
         autocomplete: true
      },
      {
         name: CITY_PARAM_NAME,
         description: 'The city you want to know the prayer times',
         type: ApplicationCommandOptionType.String,
         required: true,
         autocomplete: true
      },
   ],
};

module.exports.getTimesFromIsoDatetime = (date, timezone) => {
   const dateObject = new Date(date);

   const dateTimezone = dateObject.toLocaleString('en-GB', {
      timeZone: timezone,
   });
   return dateTimezone.split(', ')[1].split(':').slice(0, 2).join(':');
};

module.exports.run = (_client, interaction) => {
   const queryCountry = interaction.options.getString(COUNTRY_PARAM_NAME);
   const queryCity = interaction.options.getString(CITY_PARAM_NAME);
   const city = queryCity.charAt(0).toUpperCase() + queryCity.slice(1).toLowerCase();
   const country = queryCountry.charAt(0).toUpperCase() + queryCountry.slice(1).toLowerCase();

   if (!city || !country) {
      return interaction.reply({
         content: 'You must specify a city and a country',
         flags: MessageFlags.Ephemeral,
      });
   }

   retrievePrayersOfTheDay(city, country, 1, true)
      .then((data) => {
         const timezoneKey = 'timezone';

         const prayers = [
            { name: 'Fajr', emoji: '🌙', time: data.Fajr },
            { name: 'Sunrise', emoji: '🌅', time: data.Sunrise },
            { name: 'Dhuhr', emoji: '☀️', time: data.Dhuhr },
            { name: 'Asr', emoji: '🌇', time: data.Asr },
            { name: 'Maghrib', emoji: '🌆', time: data.Maghrib },
            { name: 'Isha', emoji: '🌙', time: data.Isha },
         ];

         const formattedPrayers = prayers.map(p => {
            const isoDate = new Date(p.time);
            return {
               ...p,
               iso: isoDate,
               formatted: this.getTimesFromIsoDatetime(p.time, data[timezoneKey])
            };
         });

         const now = new Date();

         // Déterminer prochaine prière
         let nextPrayer = formattedPrayers.find(p => p.iso > now);

         if (!nextPrayer) {
            nextPrayer = formattedPrayers[0]; // lendemain fallback
         }

         const description = `
      ## ⏳ Next Prayer

      > ${nextPrayer.emoji} **${nextPrayer.name}**
      > ⏰ \`${nextPrayer.formatted}\`

      ──────────────
      `;

         const embed = new EmbedBuilder()
            .setColor('#0E7C7B') // vert moderne
            .setTitle(`🕌 Prayer Times — ${city}, ${country}`)
            .setDescription(description)
            .addFields(
               formattedPrayers.map(p => ({
                  name: `${p.emoji} ${p.name}`,
                  value: `\`${p.formatted}\``,
                  inline: true
               }))
            )
            .setFooter({
               text: `MuslimBot • Stay consistent 🤍`
            })
            .setTimestamp();

         return interaction.reply({ embeds: [embed] });
      })
      .catch((error) => {
         logger.warn('Error during retrieve prayers', error);
         return interaction.reply({
            embeds: [
               new EmbedBuilder()
                  .setTitle('Location not found')
                  .setColor(vars.errorColor),
            ],
            flags: MessageFlags.Ephemeral,
         });
      });
};

module.exports.autocomplete = async (interaction) => {
   const focusedOption = interaction.options.getFocused(true);
   const focusedValue = interaction.options.getFocused();
   let choices;

   if (focusedOption.name === COUNTRY_PARAM_NAME) {
      choices = countriesAPI.getCountriesName();
   }
   else if (focusedOption.name === CITY_PARAM_NAME) {
      // Get country value
      const countryName = interaction.options.getString(COUNTRY_PARAM_NAME);
      if (countryName === null) {
         choices = [];
      } else {
         choices = countriesAPI.getCountryCities(countryName);
      }
   }

   // Ensure focused value is processed correctly (case-insensitive search)
   const filtered = choices
      .filter(choice => {
         if (focusedValue === null) return true;
         return choice.toLowerCase().startsWith(focusedValue.toLowerCase())
      })
      .slice(0, 25); // Limit to 25 suggestions

   // Respond to the interaction within 3 seconds
   await interaction.respond(
      filtered.map(choice => ({ name: choice, value: choice }))
   ).catch(error => {
      throw new Error('Error responding to autocomplete interaction:', error);
   });
};
