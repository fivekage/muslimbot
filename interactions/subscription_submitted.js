

module.exports.run = async (interaction) => {
    if (!interaction.isCommand()) return;
    
    const collectorFilter = i => i.user.id === interaction.user.id;
    try {
        const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });

        if (confirmation.customId === 'confirm') {
            await interaction.guild.members.ban(target);
            await confirmation.update({ content: `${target.username} has been banned for reason: ${reason}`, components: [] });
        } else if (confirmation.customId === 'cancel') {
            await confirmation.update({ content: 'Action cancelled', components: [] });
        }
    } catch (e) {
        await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
    }
}