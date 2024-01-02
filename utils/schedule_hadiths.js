
const { Guilds } = require('../data/models.js')
const logger = require('./logger.js')
const schedule = require('node-schedule')
const { EmbedBuilder } = require('discord.js')
const vars = require('../commands/_general/vars.js')
const rule = new schedule.RecurrenceRule();

const hadithAPIUrl = "https://random-hadith-generator.vercel.app/"

module.exports.dailyCallScheduleHadiths = async (client) => {
    rule.hour = 12
    rule.minute = 0;

    rule.tz = 'Etc/UTC';

    let hadithOk = false
    let hadith = null
    while (!hadithOk) {
        hadith = await getRandomHadith()
        if (hadith['hadith_english'] && hadith['hadith_english'].length < 1024) { // Discord embed limit
            hadithOk = true
        }
    }

    const job = schedule.scheduleJob(rule, function () {
        const guilds = Guilds()
        guilds.findAll({ where: { dailyHadithEnabled: true } }).then(guilds => {
            guilds.forEach(guild => {
                const channel = client.guilds.cache.get(guild.guildId).channels.cache.find(channel => channel.type == 0)
                if (!channel) {
                    logger.warn("No channel to send the hadith")
                    return;
                }

                const hadithBook = hadith['book'].replace('`', '')
                const hadithChapterName = hadith['chapterName'].replace('`', '')
                const hadithBookName = hadith['bookName'].replace(/[\t\n]/g, '');
                const hadithText = hadith['hadith_english'].replace('`', '')
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
        return data['data']
    }
    catch (error) {
        logger.warn("Error during retrieve prayers", error)
        return null
    }
}

const hadithsBooks = [
    "bukhari", "muslim", "abudawud", "ibnmajah", "tirmidhi"
]