const { Guilds } = require('../../data/models')
const { EmbedBuilder } = require('discord.js')
const logger = require('../../utils/logger.js')
const vars = require('../_general/vars.js')


module.exports.help = {
    name: 'hadith',
    description: "Enable or disable daily hadiths",
    options: [
        {
            name: 'enabled',
            description: 'Enable or disable daily hadiths',
            type: 5,
            required: true,
            choices: [
                {
                    name: 'Enable',
                    value: true,
                },
                {
                    name: 'Disable',
                    value: false,
                },
            ],
        },
    ],
}

module.exports.run = async (_client, interaction) => {
    if (!interaction.inGuild()) return interaction.reply("This command is only available in a server")

    const hadithEnabled = interaction.options.getBoolean('enabled')
    if (hadithEnabled === null) return interaction.reply("You must specify if you want to enable or disable daily hadiths")

    const guilds = Guilds()

    const guild = await guilds.findOne({ where: { guildId: interaction.guild.id } })
    if (!guild) {
        const embed = new EmbedBuilder()
            .setTitle("This guild is not registered")
            .setDescription("Try to kick and reinvite the bot to your server, if it didn't work, please contact me <@317033647045607424>")
            .setColor(vars.primaryColor)
            .setTimestamp()
            .setFooter({ text: 'MuslimBot 🕋 - For any help type /help command' });
        return interaction.reply({ embeds: [embed] })
    }
    guild.dailyHadithEnabled = hadithEnabled
    guild.save()
    logger.info(`Hadiths option has been changed with ${hadithEnabled} value for guild ${interaction.guild.id}`)

    if (!guild) return interaction.reply("This guild is not registered")

    const embed = new EmbedBuilder()
        .setTitle(`Hadith of the day`)
        .setDescription(hadithEnabled ?
            "Hadiths are now enabled, you will receive a hadith in your server everyday" :
            "Hadiths are now disabled")
        .setColor(vars.primaryColor)
        .setTimestamp()
        .setFooter({ text: 'MuslimBot 🕋 - For any help type /help command' });

    interaction.reply({ embeds: [embed] })
}