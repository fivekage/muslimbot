const { EmbedBuilder } = require('discord.js');
const { Users, Subscriptions } = require('../../data/models.js');
const vars = require('../_general/vars.js');

module.exports.help = {
    name: 'unsubscribe',
    description: "Unsubscribe to get notifications for prayers",
}

module.exports.run = async (_client, interaction) => {

    let user = await Users().findOne({ where: { userId: interaction.user.id } })
    if (!user) {
        const replyEmbed = new EmbedBuilder()
            .setTitle('You are not present in our subscriptions')
            .setDescription('You have to subscribe first with the command `/subscribe`')
            .setColor(vars.primaryColor);
        await interaction.reply({ embeds: [replyEmbed], ephemeral: true })
        return
    }

    let subscription = await Subscriptions().findAll({ where: { UserId: user.id } })
    if (!subscription) {
        const replyEmbed = new EmbedBuilder()
            .setTitle('You are not present in our subscriptions')
            .setDescription('You have to subscribe first with the command `/subscribe`')
            .setColor(vars.primaryColor);
        await interaction.reply({ embeds: [replyEmbed], ephemeral: true })
        return
    }
    for (const sub of subscription) {
        sub.subscriptionEnabled = false
        await sub.save()
    }
    const replyEmbed = new EmbedBuilder()
        .setTitle('Subscription removed')
        .setDescription('You will no longer receive notifications for prayers')
        .setColor(vars.primaryColor);
    return interaction.reply({ embeds: [replyEmbed] })
}

