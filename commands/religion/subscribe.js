const {
   ButtonBuilder, ButtonStyle, EmbedBuilder, ActionRowBuilder, ApplicationCommandOptionType
} = require('discord.js');
const { usersModel, subscriptionsModel } = require('../../data/models.js');
const logger = require('../../utils/logger.js');
const { retrievePrayersOfTheDay } = require('../../utils/retrieve_prayers.js');
const { CountriesAPI } = require('../../apis/countries_api.js');
const vars = require('../_general/vars.js');
const { MessageFlags } = require('discord.js');

const countriesAPI = new CountriesAPI();
(async () => {
   await countriesAPI.initialize(); // Pre-fetch countries data
})();
const COUNTRY_PARAM_NAME = 'country';
const CITY_PARAM_NAME = 'city';

module.exports.help = {
   name: 'subscribe',
   description: 'Subscription to get notifications for each prayer of the day according to the desired city',
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
         description: 'The city you are in (if you don\'t find your city, you can write it, it will work)',
         type: ApplicationCommandOptionType.String,
         required: true,
         autocomplete: true
      },
   ],
};

module.exports.run = async (_client, interaction) => {
   const queryCountry = interaction.options.getString(COUNTRY_PARAM_NAME);
   const queryCity = interaction.options.getString(CITY_PARAM_NAME);
   const city = queryCity.charAt(0).toUpperCase() + queryCity.slice(1).toLowerCase();
   const country = queryCountry.charAt(0).toUpperCase() + queryCountry.slice(1).toLowerCase();

   if (!city || !country) {
      return interaction.reply({
         content: 'You must specify a city and a country',
         flags: MessageFlags.Ephemeral
      });
   }

   if (interaction.user.bot) {
      return interaction.reply({
         content: 'You can\'t subscribe to notifications with a bot account',
         flags: MessageFlags.Ephemeral,
      });
   }

   // Check if location exists
   const locationExists = await this.checkIfLocationExists(city, country);
   if (!locationExists) {
      return interaction.reply({
         embeds: [new EmbedBuilder().setTitle('Location not found').setColor(vars.errorColor)],
         flags: MessageFlags.Ephemeral,
      });
   }

   // Create buttons to confirm or cancel
   const confirm = new ButtonBuilder()
      .setCustomId(`confirm_${city}_${country}`)
      .setLabel('Activate')
      .setEmoji('🟢')
      .setStyle(ButtonStyle.Success);

   const cancel = new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel('Cancel')
      .setEmoji('⚫')
      .setStyle(ButtonStyle.Secondary);

   const row = new ActionRowBuilder()
      .addComponents(cancel, confirm);

   const embed = new EmbedBuilder()
      .setColor('#0E7C7B')
      .setTitle('🕌 Confirm Subscription')
      .setDescription(
         `You are about to receive prayer notifications for:
         > 📍 **${city}, ${country}**
         Do you want to activate it?`
      )
      .setFooter({ text: 'MuslimBot • You can unsubscribe anytime' })
      .setTimestamp();

   await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral
   });

   // const collectorFilter = (i) => i.user.id === interaction.user.id;

   // Await confirmation
   try {
      const message = await interaction.fetchReply();
      const confirmation = await message.awaitMessageComponent({
         filter: i => i.user.id === interaction.user.id,
         time: 60000
      });

      if (confirmation.customId.startsWith('confirm_')) {
         let user = await usersModel().findOne({ where: { userId: interaction.user.id } });
         if (!user) {
            user = usersModel().build({ userId: interaction.user.id, guildId: interaction.guildId, subscribedChangelog: true });
            await user.save();
         }

         // Find or Create subscription
         const [subscription, created] = await subscriptionsModel().findOrBuild({
            where: {
               city: city, country: country, userId: user.id,
            },
            defaults: {
               subscriptionEnabled: true,
            },
         });
         if (created) {
            logger.info('Subscription created for', interaction.user.username);
         } else {
            subscription.subscriptionEnabled = true;
            logger.info('Subscription already exists but re-enabled for', interaction.user.username);
         }

         await subscription.save();
         logger.info('Notification for prayer in', city, 'activated for', interaction.user.username);

         await confirmation.update({
            embeds: [
               new EmbedBuilder()
                  .setColor('#2ECC71')
                  .setTitle('✅ Subscription Activated')
                  .setDescription(
                     `You will now receive notifications for:
                     > 📍 **${city}, ${country}**
                     May your prayers be accepted 🤍`
                  )
                  .setTimestamp()
            ],
            components: []
         });

      } else if (confirmation.customId === 'cancel') {

         await confirmation.update({
            embeds: [
               new EmbedBuilder()
                  .setColor('#95A5A6')
                  .setTitle('Action Cancelled')
                  .setDescription('No changes were made.')
                  .setTimestamp()
            ],
            components: []
         });

      }

   } catch (err) {
      await interaction.editReply({
         embeds: [
            new EmbedBuilder()
               .setColor('#E74C3C')
               .setTitle('⌛ Confirmation Expired')
               .setDescription('Please run the command again.')
         ],
         components: []
      });
   }
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

module.exports.checkIfLocationExists = async (city, country) => {
   try {
      const data = await retrievePrayersOfTheDay(city, country, 1, false);
      return data !== null;
   } catch (error) {
      logger.error('Error during check location', error);
      return false;
   }
};
