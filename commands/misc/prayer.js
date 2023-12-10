const { EmbedBuilder } = require('discord.js')
const vars = require("../_general/vars.js")

module.exports.help = {
    name : 'prayer',
    description : "Returns the times of each Muslim prayer according to the desired city",
    options: [
        {
            name: 'city',
            description: 'The city you want to know the prayer times',
            type: 3,
            required: true,
        },
    ],
}

module.exports.run =  (message) => {
    
    const query = message.options.getString('city').toUpperCase()
    const city = query.charAt(0).toUpperCase() + query.slice(1).toLowerCase()
    if(!city) return message.reply("You must specify a city")
    
    const API_ENDPOINT = `http://api.aladhan.com/v1/timingsByAddress?address=${city}`

    try{
        // Not tested, might not work
        fetch(API_ENDPOINT)
            .then(response => {
                if (!response.ok) {
                    throw Error(response.statusText);
                }
                return response.json();
            })
            .then(response => {
                const data = response['data']
       
                const embed = new EmbedBuilder()
                    .setTitle(`Prayer in ${city}`)
                    .setColor(vars.primaryColor)
                    .setAuthor({ name: `For you ${message.member.nickname}` })
                    .setThumbnail("https://cdn-icons-png.flaticon.com/512/2714/2714091.png")
                    .addFields(
                        { name: ':clock1: **Imsak**', value: ` ${data['timings']['Imsak']}`, inline: true },
                        { name: ':clock2: **Fajr**', value: `${data['timings']['Fajr']}`, inline: true },
                        { name: ':clock3: **Dhuhr**', value: `${data['timings']['Dhuhr']}`, inline: true },
                        { name: ':clock4: **Asr**', value: `${data['timings']['Asr']}`, inline: true },
                        { name: ':clock5: **Maghrib**', value: `${data['timings']['Maghrib']}`, inline: true },
                        { name: ':clock6: **Isha**', value: `${data['timings']['Isha']}`, inline: true },
                    )
                    .setFooter({text: 'Islam Bot 🕋'})
                    .setTimestamp()
                return message.reply({ embeds: [embed] })
            })
            .catch(error => console.log(error));
    }catch(error){
        console.warn("Error during retrieve prayers",error)
        return message.reply("City not found")
    }
}

