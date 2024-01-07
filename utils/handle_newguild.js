const { EmbedBuilder, PermissionsBitField } = require('discord.js')
const logger = require('./logger.js')
const { Guilds } = require('../data/models.js')
const vars = require('../commands/_general/vars.js')

module.exports.handleNewGuild = async (client) => {
    client.on('guildCreate', async guild => {
        logger.info(`Joined a new guild: ${guild.name} (${guild.id}). This guild has ${guild.memberCount} members!`);

        if (!guild.available) {
            logger.warn(`Guild ${guild.name} is not available`)
            return;
        }

        const guilds = Guilds()

        await guilds.findOrCreate({
            where: { guildId: guild.id },
            defaults: {
                guildName: guild.name,
                dailyHadithEnabled: true,
            }
        })

        const channel = guild.channels.cache.find(channel => channel.type == 0)
        if (!channel) {
            logger.warn("No channel to send the welcome message")
            return;
        }
        if (!client.guilds.cache.get(guild.id).members.me.permissionsIn(channel.id).has(PermissionsBitField.Flags.SendMessages)) {
            logger.warn(`Guild ${guild.name} doesn't have the permission to send messages in channel ${channel.name}`)
            return;
        }
        const replyEmbed = new EmbedBuilder()
            .setTitle('Assalamu alaykum 🙏')
            .setDescription('Get started with MuslimBot to receive prayer notifications and hadiths')
            .setAuthor({ name: 'Samy' })
            .setColor(vars.primaryColor)
            .setImage('https://i.imgur.com/e0JyEKJ.jpeg')
            .addFields([
                {
                    name: 'About',
                    value: `MuslimBot is a Discord bot that sends prayer notifications and hadiths to your server and DMs. It is open source and you can contribute to it on [GitHub](${vars.githubUrl})`,
                },
                {
                    name: 'Commands',
                    value: `Type \`/help\` to get a list of commands`,
                },
                {
                    name: 'Support',
                    value: `If you have any questions or suggestions, please send me a message <@317033647045607424>)`,
                },
            ])
            .setFooter({ text: 'MuslimBot 🕋 - For any help type /help command' })

        channel.send({ embeds: [replyEmbed] })
    })
}