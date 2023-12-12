const { ButtonBuilder, ButtonStyle, SlashCommandBuilder, ActionRowBuilder } = require('discord.js');
const { Users, Subscriptions } = require('../../data/models.js');

module.exports.help = {
    name : 'subscription',
    description : "Subscription to get notifications for each prayer of the day according to the desired city",
    options: [
        {
            name: 'city',
            description: 'The city you are in',
            type: 3,
            required: true,
        },
    ],
}

module.exports.run = async (interaction) => {

    const query = interaction.options.getString('city').toUpperCase()
    const city = query.charAt(0).toUpperCase() + query.slice(1).toLowerCase()

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

    const response = await interaction.user.send({
        content: `Are you sure you want to receive notifications for prayers in ${city} ?`,
        components: [row],
    });

    const collectorFilter = i => i.user.id === interaction.user.id;

    try {
        const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60000 });
        
        if (confirmation.customId === 'confirm') {
            confirmation.update({ content: `You will receive notifications for prayers in ${city}`, components: [] })
            await confirmation.message.react('✅');
            confirm.setDisabled(true);
            cancel.setDisabled(true);

            let user = await Users().findOne({ where: { userId: interaction.user.id } })
            if(!user) {
                user = Users().build({ userId: interaction.user.id })
            }
            await user.save()

            let subscription = await Subscriptions().findOne({ where: { UserId: user.id, city: city } })
            if(!subscription) {
                subscription = Subscriptions().build({ subscriptionEnabled: true,city: city, UserId: user.id })
            }

            await subscription.save()

            console.log("Notification for prayer in", city, "activated for", interaction.user.username)
            return;
        } else if (confirmation.customId === 'cancel') {
            await confirmation.update({ content: 'Action cancelled', components: [] });
        }
    } catch (e) {
        console.log(e);
        await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
    }
}