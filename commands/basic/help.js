const { EmbedBuilder, MessageFlags } = require('discord.js');
const vars = require('../_general/vars.js');
const { loadAllCommands } = require('../../utils/load_commands.js');

module.exports.help = {
   name: 'help',
   description: 'Returns a list of available commands',
};

module.exports.run = async (_client, interaction) => {

   const commands = loadAllCommands()
      .sort((a, b) => a.name.localeCompare(b.name));

   const formattedCommands = commands
      .map(cmd =>
         `\`/${cmd.name}\`\n> ${cmd.description}`
      )
      .join('\n\n');

   const embed = new EmbedBuilder()
      .setColor(vars.primaryColor)
      .setTitle('📜 Available Commands')
      .setDescription(
         `Here are the commands you can use:

         ${formattedCommands}

         Need help with a command?
         Use \`/command\` directly in the chat.`
      )
      .setFooter({ text: `MuslimBot • Requested by ${interaction.user.username}` })
      .setTimestamp();

   return interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral
   });
};