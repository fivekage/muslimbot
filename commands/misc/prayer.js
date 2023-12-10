const { MessageEmbed } = require('discord.js')

module.exports.help = {
    name : 'prayer',
    description : "Returns the times of each Muslim prayer according to the desired city"
}

module.exports.run =  (message, args) => {

    if(!args || args.length === 0) 
        return message.channel.send('`Syntaxe: <prefix>prayer <city>`')
    
    const API_ENDPOINT = `http://api.aladhan.com/v1/timingsByAddress?address=${args[0]}`
    
    try{
        // Not tested, might not work
        fetch(API_ENDPOINT)
            .then(response => {
                if (!response.ok) {
                throw Error(response.statusText);
                }
                return response.json();
            })
            .then(data => {
                const PRAYERS = (`
                    • **Fajr:** ${data['timings']['Fajr']}
                    • **Dhuhr:** ${data['timings']['Dhuhr']}
                    • **Asr:** ${data['timings']['Asr']}
                    • **Maghrib:** ${data['timings']['Maghrib']}
                    • **Isha:** ${data['timings']['Isha']}
                    • **Imsak:** ${data['timings']['Imsak']}`)
                const embed = new MessageEmbed()
                    .setTitle(`:man_wearing_turban: HEURE DES PRIÈRES 🕌 ${args[0]}`)
                    .setColor('#009000')
                    .setAuthor(message.author.tag, message.author.avatarURL )
                    .setDescription(PRAYERS)
                    .setThumbnail("https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Star_and_Crescent.svg/220px-Star_and_Crescent.svg.png")
                    .setFooter('Samy#4913', 'https://fr.screenja.com/static/img/thumbs/sangoku-logo-normal-636.png')
                return message.channel.send(embed)
            })
            .catch(error => console.log(error));
    }catch(error){
        return message.channel.send("Je trouve pas ta ville frère")
    }
}

