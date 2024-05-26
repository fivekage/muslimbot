const { EmbedBuilder } = require('discord.js');
const vars = require('../_general/vars.js');
const { loadAllCommands } = require('../../utils/load_commands.js');

module.exports.help = {
   name: 'help',
   description: 'Returns a list of available commands',
};

module.exports.run = (_client, interaction) => {
   // Load all commands and get their name and description
   const listOfCommands = loadAllCommands().sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
   }).map(
      (command) => `• **${command.name}** : ${command.description}\n`,
   ).join('');

   // Create the embed
   const helpEmbed = new EmbedBuilder()
      .setColor(vars.primaryColor)
      .setDescription(listOfCommands)
      .setAuthor({ name: `For you ${interaction.user.username}` })
      .setTitle('Commands you can use ! 📜')
      .setFooter({ text: 'Need help? Contact samouik', iconURL: vars.reecoom });

   // Send the embed
   return interaction.reply({ embeds: [helpEmbed] });
};
