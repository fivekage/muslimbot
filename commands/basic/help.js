const {EmbedBuilder} = require('discord.js');
const vars = require('../_general/vars.js');
const {loadAllCommands} = require('../../utils/load_commands.js');

module.exports.help = {
  name: 'help',
  description: 'Returns a list of available commands',
};

module.exports.run = (_client, interaction) => {
  // if(!interaction.member.hasPermission('MANAGE_interactionS')) {
  // 	return interaction.channel.send("You don't have the permissions to do that")
  // }

  const listOfCommands = loadAllCommands().map((command) => `• **${command.name}** : ${command.description}\n`).join('');

  const helpEmbed = new EmbedBuilder()
      .setColor(vars.primaryColor)
      .setDescription(listOfCommands)
      .setAuthor({name: interaction.user.username})
      .setTitle('List of available commands')
      .setFooter({text: 'Need help? Contact samouik', iconURL: vars.reecoom});

  interaction.reply({embeds: [helpEmbed]});
};
