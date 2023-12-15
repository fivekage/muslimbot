const { EmbedBuilder } = require('discord.js');
const { Users, Subscriptions } = require('../../data/models.js');

module.exports.help = {
    name : 'unsubscribe',
    description : "Unsubscribe to get notifications for each prayer of the day according to the desired city",
}

module.exports.run = async (interaction) => {
    
    let user = await Users().findOne({ where: { userId: interaction.user.id } })
    if(!user) {
        const replyEmbed = new EmbedBuilder()
            .setTitle('You are not present in our subscriptions')
            .setDescription('You have to subscribe first with the command `/subscribe`')
            .setColor(vars.primaryColor);
        await interaction.reply({ embeds: [replyEmbed], ephemeral: true })
    }
    
    let subscription = await Subscriptions().findOne({ where: { UserId: user.id} })
    subscription.subscriptionEnabled = false
    await subscription.save()
    
    const replyEmbed = new EmbedBuilder()
        .setTitle('Subscription removed')
        .setDescription('You will no longer receive notifications for prayers')
        .setColor(vars.primaryColor);
    return interaction.reply({ embeds: [replyEmbed] })
}

