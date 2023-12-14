const { EmbedBuilder } = require('discord.js')

module.exports.handleNewGuild = async (client) => {
    client.on('guildCreate', async guild => {
        const replyEmbed = new EmbedBuilder()
            .setTitle('Assalamu alaykum 🙏')
            .setDescription('Type `/help` to get started with MuslimBot 🤖');

            let channelId;
            if(guild.publicUpdatesChannelId) 
                channelId = guild.publicUpdatesChannelId
            else if(guild.systemChannelId)
                channelId = guild.systemChannelId
            else {
                console.warn("No channel to send the welcome message")
                return;
            
            }
        
            const sendChannel = await guild.channels.cache.get(channelId)
            await sendChannel.send({ embeds: [replyEmbed] })
    })
}