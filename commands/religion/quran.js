const { EmbedBuilder } = require('discord.js')
const vars = require("../_general/vars.js")
const { QueryType, useMainPlayer } = require('discord-player');

const { retrieveQuranVerses } = require('../../utils/retrieve_quran_verses.js')
const quranVerses = retrieveQuranVerses();

module.exports.help = {
    name: 'quran',
    description: "Play a random verse from the Quran",
}

module.exports.run = async (_client, interaction) => {

    const channel = interaction.member.voice.channel;
    if (!interaction.inGuild())
        interaction.reply({ content: 'You have to send this command from a guild, not in private', ephemeral: true })

    if (!channel) {
        interaction.reply({ content: 'You need to join a voice channel first!', ephemeral: true })
        return;
    }


    const player = useMainPlayer();
    await player.extractors.loadDefault(e => e === "AttachmentExtractor");

    const randomVerse = quranVerses[Math.floor(Math.random() * quranVerses.length)]
    const fullPathFile = `./quran/${randomVerse}`

    try {
        const { track } = await player.play(channel, fullPathFile, {
            searchEngine: QueryType.FILE,
            nodeOptions: {
                // nodeOptions are the options for guild node (aka your queue in simple word)
                metadata: interaction // we can access this metadata object using queue.metadata later on
            }
        });

        const playEmbed = new EmbedBuilder()
            .setColor(vars.primaryColor)
            .setDescription(`Playing: ${track.title}`)
            .setAuthor({ name: track.author, iconURL: track.thumbnail })
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.username}` })

        await interaction.reply({ embeds: [playEmbed] })

    } catch (e) {
        // let's return error if something failed
        return interaction.followUp(`Something went wrong: ${e}`);
    }
}