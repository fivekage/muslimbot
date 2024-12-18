const { EmbedBuilder } = require('discord.js');
const { usersModel, subscriptionsModel } = require('../../data/models.js');
const vars = require('../_general/vars.js');

const COUNTRY_PARAM_NAME = 'country';
const CITY_PARAM_NAME = 'city';

module.exports.help = {
   name: 'unsubscribe',
   description: 'Unsubscribe to get notifications for prayers (/subscriptions to get the list of your subscriptions)',
   options: [
      {
         name: COUNTRY_PARAM_NAME,
         description: 'The country where you want to disable the subscription',
         type: 3,
         required: true,
         autocomplete: true
      },
      {
         name: CITY_PARAM_NAME,
         description: 'The city where you want to disable the subscription',
         type: 3,
         required: true,
         autocomplete: true
      }
   ],
};

module.exports.run = async (_client, interaction) => {
   // Get query params and format them
   const queryCountry = interaction.options.getString(COUNTRY_PARAM_NAME);
   const queryCity = interaction.options.getString(CITY_PARAM_NAME);
   const city = queryCity.charAt(0).toUpperCase() + queryCity.slice(1).toLowerCase();
   const country = queryCountry.charAt(0).toUpperCase() + queryCountry.slice(1).toLowerCase();

   // Get user and check if he is present in our subscriptions
   const user = await usersModel().findOne({ where: { userId: interaction.user.id } });
   if (!user) {
      const replyEmbed = new EmbedBuilder()
         .setTitle('You are not present in our subscriptions')
         .setDescription('You have to subscribe first with the command `/subscribe`')
         .setColor(vars.primaryColor);
      await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
      return;
   }

   // Get the subscription
   const subscription = await subscriptionsModel().findOne({ where: { userId: user.id, city: city, country: country } });

   // Check if the subscription exists
   if (!subscription) {
      const replyEmbed = new EmbedBuilder()
         .setTitle('We were not able to find your subscription')
         .addFields(
            {
               name: 'Type `/subscriptions` to get the list of your subscriptions',
               value: 'Also, if you want to get notified for this location, you can subscribe with the command `/subscribe`',
               inline: false,
            },
            {
               name: 'Location',
               value: `${city}, ${country}`,
               inline: false,
            },
         )
         .setColor(vars.primaryColor)
         .setFooter({ text: vars.footerText });
      await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
      return;
   }

   // Disable the subscription
   subscription.subscriptionEnabled = false;
   await subscription.save();

   // Reply to the user
   const replyEmbed = new EmbedBuilder()
      .setTitle('Subscription removed ✅')
      .setDescription('You will no longer receive prayers notifications for this location')
      .addFields(
         {
            name: 'Location',
            value: `${city}, ${country}`,
            inline: false,
         },
      )
      .setColor(vars.primaryColor);
   return interaction.reply({ embeds: [replyEmbed] });
};

module.exports.autocomplete = async (interaction) => {
   const focusedOption = interaction.options.getFocused(true);
   const focusedValue = interaction.options.getFocused();
   let choices;

   const user = await usersModel().findOne({ where: { userId: interaction.user.id } });
   const userSubscriptions = await subscriptionsModel().findAll({
      where: { userId: user.id, subscriptionEnabled: true },
   });

   if (focusedOption.name === COUNTRY_PARAM_NAME) {
      choices = userSubscriptions.map((subscription) => subscription.country);
   }
   else if (focusedOption.name === CITY_PARAM_NAME) {
      // Get country value
      const countryName = interaction.options.getString(COUNTRY_PARAM_NAME);
      if (countryName === null) {
         choices = [];
      } else {
         choices = userSubscriptions.filter((subscription) => subscription.country === countryName).map((subscription) => subscription.city);
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
