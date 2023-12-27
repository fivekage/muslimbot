const vars = require("../_general/vars.js")
const { EmbedBuilder } = require('discord.js')
const { connectToChannel } = require('../../utils/play_quran.js')

module.exports.help = {
    name: 'quran',
    description: "Play a random verse from the Quran",
}

module.exports.run = async (client, interaction) => {

    const channel = interaction.member.voice.channel;
    if (!interaction.inGuild())
        interaction.reply({ content: 'You have to send this command from a guild, not in private', ephemeral: true })

    if (!channel) {
        interaction.reply({ content: 'You need to join a voice channel first!', ephemeral: true })
        return;
    }


    const connection = await connectToChannel(channel);
    connection.subscribe(client.player);

    const playEmbed = new EmbedBuilder()
        .setColor(vars.primaryColor)
        .setTitle(`Quran Radio 🎙️`)
        .setThumbnail("https://imgur.com/Frlrlte.png")
        .addFields(
            { name: ':musical_note: **Playing**', value: `**${client.player.currentResource.toUpperCase()}**` },
        )
        .setTimestamp()
        .setFooter({ text: `Requested by ${interaction.user.username}` })
    await interaction.reply({ embeds: [playEmbed] })
}

// Thanks to : https://github.com/discordjs/voice-examples/blob/main/radio-bot/src/bot.ts