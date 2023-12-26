const { EmbedBuilder } = require('discord.js')
const logger  = require('./logger.js')

module.exports.handleNewGuild = async (client) => {
    client.on('guildCreate', async guild => {
        logger.info(`Joined a new guild: ${guild.name} (${guild.id}). This guild has ${guild.memberCount} members!`);

        const channel = guild.channels.cache.find(channel => channel.type ==0)
        const replyEmbed = new EmbedBuilder()
            .setTitle('Assalamu alaykum 🙏')
            .setDescription('Type `/help` to get started with MuslimBot 🤖');

            if(!channel) {
                logger.warn("No channel to send the welcome message")
                return;
            }
            channel.send({ embeds: [replyEmbed] })
        })
}