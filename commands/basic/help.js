const { MessageEmbed } = require('discord.js')
const { readdirSync } = require('fs')
const path = require("path")
const vars = require("../_general/vars.js")

module.exports.help = {
	name : 'help',
	description: 'Returns a list of available commands'
}

module.exports.run = (message) => {
	if(!message.member.hasPermission('MANAGE_MESSAGES')) {
		return message.channel.send("You don't have the permissions to do that")
	}

	let listOfCommands = ""
	const loadAllName = (dir = path.join(__dirname, '..')) => {
		readdirSync(dir).forEach(dirs => {
			console.log(dirs)
			if(!dirs.match("_general")){
				commands = readdirSync(`${dir}/${dirs}/`).filter(files => files.endsWith('.js'))
				for (file of commands){
					const getFile = require(`${dir}/${dirs}/${file}`)
					listOfCommands +=  `• **${getFile.help.name}** : ${getFile.help.description}\n`
				}
			}	
		})
	}
	loadAllName()

	const helpEmbed = new MessageEmbed()
        .setColor(vars.primaryColor)
        .setDescription(listOfCommands)
		.setAuthor(message.author.tag, message.author.avatarURL())
        .setFooter(`Need help? Contact Samy#4913`, vars.reecoom)

	message.channel.send(helpEmbed)
}