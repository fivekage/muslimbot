const {
  ButtonBuilder, ButtonStyle, EmbedBuilder, ActionRowBuilder,
} = require('discord.js');
const {Users, Subscriptions} = require('../../data/models.js');
const logger = require('../../utils/logger.js');
const {retrievePrayersOfTheDay} = require('../../utils/retrieve_prayers.js');
const vars = require('../_general/vars.js');

module.exports.help = {
  name: 'subscribe',
  description: 'Subscription to get notifications for each prayer of the day according to the desired city',
  options: [
    {
      name: 'city',
      description: 'The city you are in',
      type: 3,
      required: true,
    },
    {
      name: 'country',
      description: 'The country you want to know the prayer times',
      type: 3,
      required: true,
    },
  ],
};

module.exports.run = async (_client, interaction) => {
  const queryCountry = interaction.options.getString('country');
  const queryCity = interaction.options.getString('city');
  const city = queryCity.charAt(0).toUpperCase() + queryCity.slice(1).toLowerCase();
  const country = queryCountry.charAt(0).toUpperCase() + queryCountry.slice(1).toLowerCase();

  if (!city || !country) return interaction.reply('You must specify a city and a country', ephemeral = true);

  if (interaction.user.bot) return interaction.reply('You can\'t subscribe to notifications with a bot account', ephemeral = true);

  // Check if location exists
  const locationExists = await this.checkIfLocationExists(city, country);
  if (!locationExists) {
    return interaction.reply({embeds: [new EmbedBuilder().setTitle('Location not found').setColor(vars.errorColor)], ephemeral: true});
  }

  // Create buttons to confirm or cancel
  const confirm = new ButtonBuilder()
      .setCustomId('confirm')
      .setLabel('Confirm')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Primary);

  const cancel = new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel('Cancel')
      .setEmoji('❌')
      .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder()
      .addComponents(cancel, confirm);

  // Reply to the user
  const replyEmbed = new EmbedBuilder()
      .setTitle('Thank you ! 🙏')
      .setDescription('You will receive a message to confirm your subscription');
  await interaction.reply({embeds: [replyEmbed], ephemeral: true});
  const response = await interaction.user.send({
    content: `Are you sure you want to receive notifications for prayers in ${city} ?`,
    components: [row],
  });

  const collectorFilter = (i) => i.user.id === interaction.user.id;

  // Await confirmation
  try {
    const confirmation = await response.awaitMessageComponent({filter: collectorFilter, time: 60000});

    if (confirmation.customId === 'confirm') {
      let user = await Users().findOne({where: {userId: interaction.user.id}});
      if (!user) {
        user = Users().build({userId: interaction.user.id, guildId: interaction.guildId});
        await user.save();
      }

      // Find or Create subscription
      const [subscription, created] = await Subscriptions().findOrBuild({
        where: {
          city: city, country: country, UserId: user.id,
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

      // Confirmation message
      await confirmation.update({content: `You will receive notifications for prayers in ${city}`, components: []});
      await confirmation.message.react('✅');
      confirm.setDisabled(true);
      cancel.setDisabled(true);
    } else if (confirmation.customId === 'cancel') {
      await confirmation.update({content: 'Action cancelled', components: []});
    }
  } catch (e) {
    logger.error(e);
    await interaction.editReply({content: 'Confirmation not received within 1 minute, cancelling', components: []});
  }
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
