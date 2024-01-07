const { QuizzQuestions, QuizzAnswers } = require('../../data/models')
const { EmbedBuilder, PermissionsBitField } = require('discord.js')
const logger = require('../../utils/logger.js')
const vars = require('../_general/vars.js')
const { waitFor, sleep } = require('../../utils/wait_for.js')
const Sequelize = require('sequelize')

module.exports.help = {
    name: 'quizz',
    description: "Play a quizz about Islam",
}

module.exports.run = async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true })

    let { channel } = await interaction
    logger.info(`Quizz has been started by ${interaction.user.id}`)

    if (interaction.guild && !client.guilds.cache.get(interaction.guild.id).members.me.permissionsIn(channel.id).has(PermissionsBitField.Flags.SendMessages)) {
        logger.warn(`Guild ${interaction.guild.name} doesn't have the permission to send messages in channel ${channel.name}`)
        return;
    }
    if (!channel && !interaction.guild) {
        logger.warn("No channel to send the quizz")
        channel = interaction.user
    }

    // Start process
    // Initialize emojis and collector
    const emojis =
    {
        '1️⃣': ':one:',
        '2️⃣': ':two:',
        '3️⃣': ':three:',
        '4️⃣': ':four:',
        '5️⃣': ':five:'
    }
    const collectorFilter = (reaction, _user) => {
        return Object.values(emojis).includes(reaction.emoji.name);
    };

    const quizzQuestions = QuizzQuestions()
    const quizzAnswers = QuizzAnswers()

    // Get 5 random questions
    const quizz = await quizzQuestions.findAll({ order: Sequelize.literal('rand()'), limit: 5, include: quizzAnswers });

    let quizzKeyValues = []
    quizz.forEach((q) => {
        quizzKeyValues.push({
            question: q.question,
            answers: [...q.QuizzAnswers.map((a, i) => ({ emoji: Object.keys(emojis)[i], answer: a.answer, valid: a.valid }))]
        })
    })


    const embedStart = new EmbedBuilder()
        .setTitle(`Quizz about Islam`)
        .setDescription("This quizz will start in 5 seconds, you will have to answer 5 questions. You will have 30 seconds for each questions.")
        .setColor(vars.primaryColor)
        .setTimestamp()
        .setFooter({ text: 'You have 30 seconds for each questions, good luck !' })
    await interaction.editReply({ embeds: [embedStart], ephemeral: true })

    await sleep(5000)
    // Start quizz
    for (const quizzQuestion of quizzKeyValues) {

        // Send quizz
        const embed = new EmbedBuilder()
            .setColor(vars.primaryColor)
            .setFooter({ text: '30 seconds left..' })
            .addFields({ name: quizzQuestion.question, value: quizzQuestion.answers.map(a => `${a.emoji} ${a.answer}`).join('\n') });

        const message = await channel.send({ embeds: [embed] })
        quizzQuestion.answers.forEach(async a => {
            await message.react(a.emoji)
        })

        // Awaiting reactions now
        const responses = []
        let anwsered = false
        const collector = message.createReactionCollector({ collectorFilter, time: 30_000 });
        collector.on('collect', r => responses.push(r.emoji.name));

        await collector.on('end', async () => {

            anwsered = true
            const correctEmbed = new EmbedBuilder()
                .setColor(vars.greenColor)
                .addFields({ name: quizzQuestion.question, value: quizzQuestion.answers.map(a => `${a.emoji} ${a.answer} ${a.valid ? '✅' : '❌'}`).join('\n') });


            await message.edit({ embeds: [correctEmbed] })
        })

        await waitFor(() => anwsered === true, 200, 60 * 10000) // checks every 200 milliseconds, 10 seconds timeout

    }
    logger.info("Quizz ended for guild ", interaction?.guild?.id ?? interaction.user.username)
    const embed = new EmbedBuilder()
        .setTitle(`Quizz ended`)
        .setDescription("Thanks for playing !")
        .setColor(vars.primaryColor)
        .setFooter({ text: 'MuslimBot 🕋 - For any help type /help command' })

    await channel.send({ embeds: [embed] })

}


