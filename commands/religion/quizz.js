const { EmbedBuilder, PermissionsBitField } = require('discord.js');
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

	const guildFetched = await client.guilds.fetch(interaction.guild.id);
	if (interaction.guild && !guildFetched.members.me.permissionsIn(channel.id).has(PermissionsBitField.Flags.SendMessages)) {
		logger.warn(`Guild ${interaction.guild.name} doesn't have the permission to send messages in channel ${channel.name}`);
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
	const collectorFilter = (reaction, _user) => Object.keys(emojis).includes(reaction.emoji.name);

	const quizzQuestions = quizzQuestionsModel();
	const quizzAnswers = quizzAnswersModel();

	// Get 5 random questions
	const quizz = await quizzQuestions.findAll({ order: Sequelize.literal('rand()'), limit: 5, include: quizzAnswers });

	const quizzKeyValues = [];
	quizz.forEach((q) => {
		quizzKeyValues.push({
			question: q.question,
			answers: [...q.quizzAnswersModel.map((a, i) => ({ emoji: Object.keys(emojis)[i], answer: a.answer, valid: a.valid }))],
		});
	});

	const embedStart = new EmbedBuilder()
		.setTitle('Quizz about Islam')
		.setDescription('This quizz will start in 5 seconds, you will have to answer 5 questions. You will have 15 seconds for each questions.')
		.setColor(vars.primaryColor)
		.setTimestamp();
	await interaction.editReply({ embeds: [embedStart] });

	await sleep(5000);
	// Start quizz
	const me = client.user;

	const editEmbedWithCorrectAnswser = (message, quizzQuestion, questionValid) => {
		const correctEmbed = new EmbedBuilder()
			.setColor(questionValid ? vars.greenColor : vars.redColor)
			.addFields({ name: quizzQuestion.question, value: quizzQuestion.answers.map((a) => `${a.emoji} ${a.answer} ${a.valid ? '✅' : '❌'}`).join('\n') })
			.setFooter({ text: `Good answer was : ${quizzQuestion.answers.find((a) => a.valid).answer}` });
		message.edit({ embeds: [correctEmbed] });
	};

	const responses = [];
	for (const quizzQuestion of quizzKeyValues) {
		// Send quizz
		const embed = new EmbedBuilder()
			.setColor(vars.primaryColor)
			.addFields({ name: quizzQuestion.question, value: quizzQuestion.answers.map((a) => `${a.emoji} ${a.answer}`).join('\n') });

		const message = await channel.send({ embeds: [embed] });
		quizzQuestion.answers.forEach(async (a) => {
			await message.react(a.emoji);
		});

		// Awaiting reactions now
		let answered = false;
		const collector = message.createReactionCollector({ filter: collectorFilter, time: 15_000 });
		collector.on('collect', (r) => {
			if (r.users.cache.last().id != me.id) {
				const validQuestion = quizzQuestion.answers.find((a) => a.emoji == r.emoji.name).valid;
				responses.push({
					valid: validQuestion,
					user: r.users.cache.last().id,
				});
				answered = true;
				editEmbedWithCorrectAnswser(message, quizzQuestion, validQuestion);
			}
		});

		await collector.on('end', async () => {
			if (!answered) {
				editEmbedWithCorrectAnswser(message, quizzQuestion, false);
			}
			answered = true;
		});

		await waitFor(() => answered === true, 200, 60 * 10000); // checks every 200 milliseconds, 15 seconds timeout
	}
	logger.info('Quizz finished for ', interaction?.guild?.id ? `guild ${interaction.guild.name}` : `user ${interaction.user.username}`);
	const embed = new EmbedBuilder()
		.setAuthor(`Quizz finished for ${interaction.user.username}`)
		.setDescription(`You have reached the end of the quizz, you have **${responses.filter((r) => r.valid).length}** good answers.`)
		.setColor(vars.primaryColor)
		.setFooter({ text: 'MuslimBot 🕋 - For any help type /help command' });

	await channel.send({ embeds: [embed] });
};
