const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const vars = require('../_general/vars.js');
const { connectToChannel } = require('../../utils/play_quran.js');
const logger = require('../../utils/logger.js');

module.exports.help = {
   name: 'quran',
   description: 'Play radio quran in your voice channel',
};

module.exports.run = async (client, interaction) => {
   if (!interaction.inGuild()) {
      return interaction.reply({ content: 'You have to send this command from a guild, not in private', ephemeral: true });
   }

   const { channel } = interaction.member.voice;
   if (!channel) {
      interaction.reply({ content: 'You need to join a voice channel first!', ephemeral: true });
      return;
   }
   const guildFetched = await client.guilds.fetch(interaction.guild.id);
   if (!guildFetched.members.me.permissionsIn(channel.id).has(PermissionsBitField.Flags.Connect)) {
      logger.warn(`I don't have the permission to send messages in guild ${interaction.guild.id} -> channel ${channel.name}`);
      return;
   }

   const connection = await connectToChannel(channel);
   connection.subscribe(client.player);

   const playEmbed = new EmbedBuilder()
      .setColor(vars.primaryColor)
      .setTitle('Quran Radio 🎙️')
      .setThumbnail('https://imgur.com/Frlrlte.png')
      .addFields(
         { name: ':musical_note: **Playing**', value: `**${client.player.currentResource.toUpperCase()}**` },
      )
      .setFooter({ text: `Requested by ${interaction.user.username}` });
   await interaction.reply({ embeds: [playEmbed] });
};

// Thanks to : https://github.com/discordjs/voice-examples/blob/main/radio-bot/src/bot.ts
