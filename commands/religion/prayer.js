const { EmbedBuilder } = require('discord.js')
const vars = require("../_general/vars.js")
const logger = require('../../utils/logger.js')

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

    if (!city || !country) return interaction.reply("You must specify a city and a country")

    const API_ENDPOINT = `http://api.aladhan.com/v1/timingsByAddress?address=${city},${country}`
    try {
        fetch(API_ENDPOINT)
            .then(response => {
                if (!response.ok) {
                    return interaction.reply({ text: "Address not found", ephemeral: true })
                }
                return response.json();
            })
            .then(response => {
                const data = response['data']

                const embed = new EmbedBuilder()
                    .setTitle(`Prayer in ${city}, ${country}`)
                    .setColor(vars.primaryColor)
                    .setAuthor({ name: `For you ${interaction.user.username}` })
                    .setThumbnail("https://cdn-icons-png.flaticon.com/512/2714/2714091.png")
                    .addFields(
                        { name: ':clock1: **Imsak**', value: ` ${data['timings']['Imsak']}`, inline: true },
                        { name: ':clock2: **Fajr**', value: `${data['timings']['Fajr']}`, inline: true },
                        { name: ':clock3: **Dhuhr**', value: `${data['timings']['Dhuhr']}`, inline: true },
                        { name: ':clock4: **Asr**', value: `${data['timings']['Asr']}`, inline: true },
                        { name: ':clock5: **Maghrib**', value: `${data['timings']['Maghrib']}`, inline: true },
                        { name: ':clock6: **Isha**', value: `${data['timings']['Isha']}`, inline: true },
                    )
                    .setFooter({ text: 'MuslimBot 🕋 - For any help type /help command' })
                    .setTimestamp()
                return interaction.reply({ embeds: [embed] })
            })
            .catch(error => logger.error(error));
    } catch (error) {
        logger.warn("Error during retrieve prayers", error)
        return interaction.reply("City not found")
    }
}

