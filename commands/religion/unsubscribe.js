const { EmbedBuilder } = require('discord.js');
const { usersModel, subscriptionsModel } = require('../../data/models.js');
const vars = require('../_general/vars.js');

module.exports.help = {
   name: 'unsubscribe',
   description: 'Unsubscribe to get notifications for prayers (/subscriptions to get the list of your subscriptions)',
   options: [
      {
         name: 'city',
         description: 'The city where you want to disable the subscription',
         type: 3,
         required: true,
      },
      {
         name: 'country',
         description: 'The country where you want to disable the subscription',
         type: 3,
         required: true,
      },
   ],
};

module.exports.run = async (_client, interaction) => {
   // Get query params and format them
   const queryCountry = interaction.options.getString('country');
   const queryCity = interaction.options.getString('city');
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
   const subscription = await subscriptionsModel().findOne({ where: { UserId: user.id, city: city, country: country } });

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
