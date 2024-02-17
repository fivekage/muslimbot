const { EmbedBuilder } = require('discord.js')
const vars = require("../_general/vars.js")
const logger = require('../../utils/logger.js')
const { retrievePrayersOfTheDay } = require('../../utils/retrieve_prayers.js')

module.exports.help = {
    name: 'prayer',
    description: "Returns the times of each Muslim prayer according to the desired city",
    options: [
        {
            name: 'city',
            description: 'The city you want to know the prayer times',
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
}

module.exports.run = (_client, interaction) => {

    const queryCountry = interaction.options.getString('country')
    const queryCity = interaction.options.getString('city')
    const city = queryCity.charAt(0).toUpperCase() + queryCity.slice(1).toLowerCase()
    const country = queryCountry.charAt(0).toUpperCase() + queryCountry.slice(1).toLowerCase()

    if (!city || !country) return interaction.reply({ content: "You must specify a city and a country", ephemeral: true })

    retrievePrayersOfTheDay(city, country, false)
        .then(data => {
            const embed = new EmbedBuilder()
                .setTitle(`Prayer in ${city}, ${country}`)
                .setColor(vars.primaryColor)
                .setAuthor({ name: `For you ${interaction.user.username}` })
                .setThumbnail("https://cdn-icons-png.flaticon.com/512/2714/2714091.png")
                .addFields(
                    { name: ':clock1: **Imsak**', value: ` ${data['Imsak']}`, inline: true },
                    { name: ':clock2: **Fajr**', value: `${data['Fajr']}`, inline: true },
                    { name: ':clock3: **Dhuhr**', value: `${data['Dhuhr']}`, inline: true },
                    { name: ':clock4: **Asr**', value: `${data['Asr']}`, inline: true },
                    { name: ':clock5: **Maghrib**', value: `${data['Maghrib']}`, inline: true },
                    { name: ':clock6: **Isha**', value: `${data['Isha']}`, inline: true },
                )
                .setFooter({ text: 'MuslimBot 🕋 - For any help type /help command' })
                .setTimestamp()
            return interaction.reply({ embeds: [embed] })
        })
        .catch(error => {
            logger.warn("Error during retrieve prayers", error)
            return interaction.reply({ embeds: [new EmbedBuilder().setTitle('Location not found').setColor(vars.errorColor)], ephemeral: true })
        });

}

