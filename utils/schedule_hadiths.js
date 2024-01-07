
const { Guilds } = require('../data/models.js')
const logger = require('./logger.js')
const schedule = require('node-schedule')
const { EmbedBuilder, PermissionsBitField } = require('discord.js')
const vars = require('../commands/_general/vars.js')
const rule = new schedule.RecurrenceRule();

const hadithAPIUrl = process.env.HADITH_API_URL

const dailyCallScheduleHadiths = (client) => {
    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV === 'development') {
        rule.hour = new schedule.Range(0, 59); // Todo: change to 0
        rule.minute = new schedule.Range(0, 59); // Todo: change to 0
    }
    else {
        rule.hour = process.env.HADITH_SCHEDULE_HOUR ?? 10
        rule.minute = process.env.HADITH_SCHEDULE_MINUTE ?? 0;
    }
    rule.tz = 'Etc/UTC';

    const job = schedule.scheduleJob(rule, async function () {
        const guilds = Guilds()
        // Fetch hadith
        let hadithOk = false
        let hadith = null
        while (!hadithOk) {
            try {
                hadith = await getRandomHadith()
                if (hadith['hadith_english'] && hadith['hadith_english'].length < 1024) { // Discord embed limit
                    hadithOk = true
                }
            } catch (error) {
                logger.error("Error during retrieve hadith", error)
                return
            }
            logger.debug("Hadith length", hadith['hadith_english'].length)
        }

        // Send hadith to all guilds
        guilds.findAll({ where: { dailyHadithEnabled: true } }).then(guilds => {
            guilds.forEach(guild => {
                const guildCache = client.guilds.cache.get(guild.guildId)
                const channel = guildCache?.channels.cache.find(channel => channel.type == 0)

                if (!channel) {
                    logger.warn("No channel to send the hadith in guild", guild.guildId)
                    return;
                }

                if (!client.guilds.cache.get(guild.id).members.me.permissionsIn(channel.id).has(PermissionsBitField.Flags.SendMessages)) {
                    logger.warn(`Guild ${guild.name} doesn't have the permission to send messages in channel ${channel.name}`)
                    return;
                }

                logger.info(`Sending hadith to guild ${guild.guildId}`)

                const hadithBook = hadith['book'].replace('`', '')
                const hadithChapterName = hadith['chapterName'].replace('`', '')
                const hadithBookName = hadith['bookName'].replace(/[\t\n]/g, '');
                const hadithText = hadith['hadith_english'].replace('`', '').trim().replace(/[\t\n]/g, '').replace('"', '')
                const hadithHeader = hadith['header']?.replace('`', '') ?? '\u200B'

                try {
                    const replyEmbed = new EmbedBuilder()
                        .setTitle(`Hadith of the day`)
                        .setDescription(hadithHeader)
                        .addFields([
                            {
                                name: `From : ${hadithBook} - ${hadithBookName}`,
                                value: hadithChapterName,
                            },
                            {
                                name: '\u200B',
                                value: `"*${hadithText}*"`,
                            },
                        ])
                        .setColor(vars.primaryColor)
                        .setThumbnail("https://i.imgur.com/DCFtkTv.png")
                        .setFooter({ text: ` ${hadith['refno']}` })
                        .setTimestamp();

                    channel.send({ embeds: [replyEmbed] })
                    logger.info(`Hadith sent to guild ${guild.guildId}`)
                } catch (error) {
                    logger.error("Error during create embed for hadith", error)
                    return
                }
            });
        })
    });

    logger.info(`Job Schedule Hadiths ${job.name} scheduled at ${job.nextInvocation()}`);
}

const getRandomHadith = async () => {
    const hadithBook = hadithsBooks[Math.floor(Math.random() * hadithsBooks.length)]

    const API_ENDPOINT = `${hadithAPIUrl}${hadithBook}`
    try {
        const response = await fetch(API_ENDPOINT)
        const data = await response.json()
        logger.info("Hadih retrieved successfully from API")
        return data['data']
    }
    catch (error) {
        logger.error("Error during retrieve hadith", error)
        throw error
    }
}

const hadithsBooks = [
    "bukhari", "muslim", "abudawud", "ibnmajah", "tirmidhi"
]

module.exports = {
    dailyCallScheduleHadiths
}