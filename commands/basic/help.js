const { EmbedBuilder } = require('discord.js')
const vars = require("../_general/vars.js")
const { loadAllCommands } = require('../../utils/load_commands.js')

module.exports.help = {
	name : 'help',
	description: 'Returns a list of available commands'
}

module.exports.run = (message) => {
	// if(!message.member.hasPermission('MANAGE_MESSAGES')) {
	// 	return message.channel.send("You don't have the permissions to do that")
	// }

	let listOfCommands = loadAllCommands().map(command => `• **${command.name}** : ${command.description}\n`).join('')

	const helpEmbed = new EmbedBuilder()
        .setColor(vars.primaryColor)
        .setDescription(listOfCommands)
		.setAuthor({ name: message.member.nickname })
		.setTimestamp()
        .setFooter({ text: 'Need help? Contact samouik' , iconURL: vars.reecoom })

	message.reply({ embeds: [helpEmbed] })
}