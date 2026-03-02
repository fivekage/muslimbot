const {
   EmbedBuilder,
   PermissionsBitField,
   ActionRowBuilder,
   ButtonBuilder,
   ButtonStyle,
   MessageFlags
} = require('discord.js');
const Sequelize = require('sequelize');
const { quizzQuestionsModel, quizzAnswersModel } = require('../../data/models');
const logger = require('../../utils/logger.js');
const vars = require('../_general/vars.js');
const { waitFor, sleep } = require('../../utils/wait_for.js');

module.exports.help = {
   name: 'quizz',
   description: 'Play a quizz about Islam',
};

module.exports.run = async (client, interaction) => {
   await interaction.deferReply();

   let { channel } = await interaction;
   logger.info(`Quizz has been started by ${interaction.user.id}`);

   const guildFetched = await client.guilds.fetch(interaction.guild?.id);
   if (guildFetched != null && interaction.guild && !guildFetched.members.me.permissionsIn(channel.id).has(PermissionsBitField.Flags.SendMessages)) {
      logger.warn(`Guild ${interaction.guild.name} doesn't have the permission to send messages in channel ${channel.name}`);
      await interaction.editReply({ content: 'I don\'t have the permission to send messages in this channel', flags: MessageFlags.Ephemeral });
      return;
   }
   if (!channel && !interaction.guild) {
      logger.warn('No channel to send the quizz');
      channel = interaction.user;
   }

   // Start process
   // Initialize emojis and collector
   const emojis = {
      '1️⃣': ':one:',
      '2️⃣': ':two:',
      '3️⃣': ':three:',
      '4️⃣': ':four:',
      '5️⃣': ':five:',
   };

   const quizzQuestions = quizzQuestionsModel();
   const quizzAnswers = quizzAnswersModel();

   // Get 5 random questions
   const quizz = await quizzQuestions.findAll({ order: Sequelize.literal('rand()'), limit: 5, include: quizzAnswers });

   const quizzKeyValues = [];
   quizz.forEach(async (q) => {
      answers = await quizzAnswers.findAll({ where: { questionId: q.id } })
      quizzKeyValues.push({
         question: q.question,
         answers: answers.map((a, i) => ({ emoji: Object.keys(emojis)[i], answer: a.answer, valid: a.valid })),
      });
   });

   const embedStart = new EmbedBuilder()
      .setColor(vars.quizzColor)
      .setTitle('🧠 Islamic Quiz Challenge')
      .setDescription(
         `You are about to start a 5-question quiz about Islam.
         ⏳ **15 seconds per question**
         🏆 Try to get the highest score possible!
         Starting in **5 seconds...**`
      )
      .setFooter({ text: 'MuslimBot • May Allah increase your knowledge 🤍' })
      .setTimestamp();
   await interaction.editReply({ embeds: [embedStart] });

   await sleep(5000);
   // Start quizz
   const me = client.user;

   const editEmbedWithCorrectAnswser = (message, quizzQuestion, questionValid) => {
      const correctAnswer = quizzQuestion.answers.find(a => a.valid);

      const resultEmbed = new EmbedBuilder()
         .setColor(questionValid ? vars.greenColor : vars.redColor)
         .setTitle(questionValid ? '✅ Correct Answer!' : '❌ Wrong Answer')
         .setDescription(
            `### ${quizzQuestion.question}
            ${quizzQuestion.answers
               .map(a =>
                  `${a.emoji} ${a.answer} ${a.valid ? '✅' : ''}`
               ).join('\n')}
            ${questionValid
               ? 'Great job! Keep going 🔥'
               : `The correct answer was:\n**${correctAnswer.answer}**`
            }`
         )
         .setFooter({ text: 'Next question coming...' })
         .setTimestamp();

      message.edit({ embeds: [resultEmbed] });
   };

   const responses = [];
   for (let i = 0; i < quizzKeyValues.length; i++) {
      const quizzQuestion = quizzKeyValues[i];

      const buttons = quizzQuestion.answers.map((a, index) =>
         new ButtonBuilder()
            .setCustomId(`answer_${index}`)
            .setLabel(`${index + 1}`)
            .setStyle(ButtonStyle.Primary)
      );

      const row = new ActionRowBuilder().addComponents(buttons);

      const embed = new EmbedBuilder()
         .setColor(vars.quizzColor)
         .setTitle(`📖 Question ${i + 1}/5`)
         .setDescription(
            `### ${quizzQuestion.question}

${quizzQuestion.answers
               .map((a, idx) => `**${idx + 1}.** ${a.answer}`)
               .join('\n')}

⏳ *You have 15 seconds to answer...*`
         )
         .setTimestamp();

      const message = await channel.send({
         embeds: [embed],
         components: [row]
      });

      try {
         const confirmation = await message.awaitMessageComponent({
            filter: (i) => i.user.id === interaction.user.id,
            time: 15000
         });

         const index = parseInt(confirmation.customId.split('_')[1]);
         const selected = quizzQuestion.answers[index];
         const isCorrect = selected.valid;

         responses.push({ valid: isCorrect });

         // Désactiver les boutons
         row.components.forEach(btn => btn.setDisabled(true));

         const resultEmbed = new EmbedBuilder()
            .setColor(isCorrect ? vars.greenColor : vars.redColor)
            .setTitle(isCorrect ? '✅ Correct Answer!' : '❌ Wrong Answer')
            .setDescription(
               `### ${quizzQuestion.question}

${quizzQuestion.answers
                  .map((a, idx) =>
                     `**${idx + 1}.** ${a.answer} ${a.valid ? '✅' : ''}`
                  ).join('\n')}

${isCorrect
                  ? 'Great job! 🔥'
                  : `Correct answer: **${quizzQuestion.answers.find(a => a.valid).answer}**`
               }`
            )
            .setTimestamp();

         await confirmation.update({
            embeds: [resultEmbed],
            components: [row]
         });

      } catch (err) {
         // Temps écoulé
         row.components.forEach(btn => btn.setDisabled(true));

         responses.push({ valid: false });

         const timeoutEmbed = new EmbedBuilder()
            .setColor(vars.redColor)
            .setTitle('⌛ Time’s Up!')
            .setDescription(
               `### ${quizzQuestion.question}

${quizzQuestion.answers
                  .map((a, idx) =>
                     `**${idx + 1}.** ${a.answer} ${a.valid ? '✅' : ''}`
                  ).join('\n')}

You didn’t answer in time.`
            )
            .setTimestamp();

         await message.edit({
            embeds: [timeoutEmbed],
            components: [row]
         });
      }

      await sleep(2500);
   }
   logger.info('Quizz finished for ', interaction?.guild?.id ? `guild ${interaction.guild.name}` : `user ${interaction.user.username}`);
   const score = responses.filter(r => r.valid).length;
   const percentage = Math.round((score / 5) * 100);

   const embed = new EmbedBuilder()
      .setColor(vars.primaryColor)
      .setTitle('🏆 Quiz Completed!')
      .setDescription(
         `You have completed the quiz!
         🎯 **Score:** ${score}/5
         📊 **Success Rate:** ${percentage}%
         ${percentage === 100
            ? '🌟 Perfect score! MashaAllah!'
            : percentage >= 60
               ? '👏 Well done! Keep learning!'
               : '📚 Keep studying and try again!'
         }`
      )
      .setFooter({ text: vars.footerText })
      .setTimestamp();

   await channel.send({ embeds: [embed] });
};
