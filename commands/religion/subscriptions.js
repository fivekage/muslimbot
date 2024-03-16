const {
	EmbedBuilder,
} = require('discord.js');
const { subscriptionsModel, usersModel } = require('../../data/models.js');
const logger = require('../../utils/logger.js');
const vars = require('../_general/vars.js');

module.exports.help = {
	name: 'subscriptions',
	description: 'Get list of your subscriptions',
};

module.exports.run = async (_client, interaction) => {
	// Get user and subscriptions
	const user = await usersModel().findOne({ where: { userId: interaction.user.id } });
	const userSubscriptions = await subscriptionsModel().findAll({
		where: { userId: user.id },
	});

	// Return if no subscriptions
	if (userSubscriptions.length === 0) {
		const embed = new EmbedBuilder()
			.setTitle('You don\'t have any subscriptions')
			.setColor(vars.primaryColor)
			.setAuthor({ name: `For you ${interaction.user.username}` })
			.setThumbnail('https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExc2syc3F3ODZpaW50MnQ1ZzVwYWdhbXl6em5zcHMzOTVqMmhseGhhNSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/12ihpr4WmwKJsQ/giphy.gif')
			.setDescription('You can subscribe to a city by using the `/subscribe` command')
			.setFooter({ text: 'MuslimBot 🕋 - For any help type /help command' });

		return interaction.reply({ embeds: [embed] });
	}

	// Map subscriptions to make the process easier
	const subscriptionsMapped = userSubscriptions.map((subscription) => {
		return {
			name: `${subscription.country}, ${subscription.city}`,
			createdAt: subscription.createdAt.toLocaleString('en-GB', { timeZone: 'UTC' }),
			enabled: subscription.subscriptionEnabled ? true : false,
		};
	});
	const result = subscriptionsMapped.reduce((x, y) => {
		(x[y.enabled] = x[y.enabled] || []).push(y);
		return x;
	}, {});

	// Get Two subscriptionsModel Groups (Enabled, Disabled)
	const enabledSubscriptions = result.true;
	const disabledSubscriptions = result.false;


	// Create the embed to send with enabled and disabled subscriptions
	const embed = new EmbedBuilder()
		.setTitle('Your subscriptions')
		.setColor(vars.primaryColor)
		.setAuthor({ name: `For you ${interaction.user.username}` })
		.setThumbnail('https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3c0cjc1dDd5NTBxOHZ6dThpaXI5dzQ4amhvdXBjempqdnV1MTgyMyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bDvmNBBqLutSlTLTIo/giphy.gif')
		.addFields(
			...enabledSubscriptions.map((subscription) => {
				return {
					name: `${subscription.name}`,
					value: `Currently ${subscription.enabled ? 'enabled' : 'disabled'}, created at ${subscription.createdAt}`,
					inline: false,
				};
			}),
			...disabledSubscriptions.map((subscription) => {
				return {
					name: `${subscription.name}`,
					value: `Currently ${subscription.enabled ? 'enabled' : 'disabled'}, created at ${subscription.createdAt}`,
					inline: false,
				};
			}),
		)
		.setFooter({ text: '(Thank you 🙏) MuslimBot 🕋 - For any help type /help command' });

	// Send the embed
	logger.info(`Subscriptions (${userSubscriptions.length}) for ${interaction.user.username} sent`);
	interaction.reply({ embeds: [embed] });
};
