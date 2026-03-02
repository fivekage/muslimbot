const {
   EmbedBuilder, ApplicationCommandOptionType
} = require('discord.js');
const { subscriptionsModel, usersModel } = require('../../data/models.js');
const logger = require('../../utils/logger.js');
const vars = require('../_general/vars.js');

const SHOW_ONLY_ENABLED_PARAM_NAME = 'show_only_enabled';
module.exports.help = {
   name: 'subscriptions',
   description: 'Get list of your subscriptions',
   options: [
      {
         name: SHOW_ONLY_ENABLED_PARAM_NAME,
         description: 'Show only enabled subscriptions, hide disabled ones',
         type: ApplicationCommandOptionType.Boolean,
         required: false
      },
   ]
};

module.exports.run = async (_client, interaction) => {
   // Get the value of the option SHOW_ONLY_ENABLED_PARAM_NAME
   const showOnlyEnabled = interaction.options.getBoolean(SHOW_ONLY_ENABLED_PARAM_NAME) || false;

   // Get user and subscriptions
   const user = await usersModel().findOne({ where: { userId: interaction.user.id } });
   const userSubscriptions = await subscriptionsModel().findAll({
      where: { userId: user.id },
   });

   // Return if no subscriptions
   if (userSubscriptions.length === 0) {
      const embed = new EmbedBuilder()
         .setTitle('You don\'t have any subscriptions')
         .setColor(vars.primaryColor)
         .setAuthor({ name: `For you ${interaction.user.username}` })
         .setThumbnail('https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExc2syc3F3ODZpaW50MnQ1ZzVwYWdhbXl6em5zcHMzOTVqMmhseGhhNSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/12ihpr4WmwKJsQ/giphy.gif')
         .setDescription('You can subscribe to a city by using the `/subscribe` command')
         .setFooter({ text: vars.footerText });

      return interaction.reply({ embeds: [embed] });
   }

   // Map subscriptions to make the process easier
   const subscriptionsMapped = userSubscriptions.map((subscription) => {
      return {
         name: `${subscription.country}, ${subscription.city}`,
         createdAt: subscription.createdAt.toLocaleString('en-GB', { timeZone: 'UTC' }),
         enabled: subscription.subscriptionEnabled
      };
   });
   const result = subscriptionsMapped.reduce((x, y) => {
      let value = x[y.enabled] = x[y.enabled] || [];
      value.push(y);
      return x;
   }, {});

   // Get Two subscriptionsModel Groups (Enabled, Disabled)
   const enabledSubscriptions = result.true || [];
   const disabledSubscriptions = showOnlyEnabled ? [] : result.false || [];


   // Create the embed to send with enabled and disabled subscriptions
   const enabledList = enabledSubscriptions
      .map(sub => `🟢 **${sub.name}**\n└ Created: \`${sub.createdAt}\``)
      .join('\n\n');

   const disabledList = disabledSubscriptions.length > 0
      ? disabledSubscriptions
         .map(sub => `⚫ ~~${sub.name}~~\n└ Created: \`${sub.createdAt}\``)
         .join('\n\n')
      : null;

   const descriptionParts = [];

   if (enabledList) {
      descriptionParts.push(`## 🟢 Active Subscriptions\n\n${enabledList}`);
   }

   if (disabledList) {
      descriptionParts.push(`\n## ⚫ Disabled Subscriptions\n\n${disabledList}`);
   }

   const embed = new EmbedBuilder()
      .setColor(vars.subColor)
      .setTitle('📩 Your Subscriptions')
      .setDescription(descriptionParts.join('\n'))
      .setFooter({
         text: `MuslimBot • Manage anytime with /subscribe`
      })
      .setTimestamp();

   // Send the embed
   logger.info(`Subscriptions (${userSubscriptions.length}) for ${interaction.user.username} sent`);
   interaction.reply({ embeds: [embed] });
};
