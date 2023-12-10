const { Client, REST, GatewayIntentBits } = require('discord.js')
const {loadAllCommands} = require('./utils/load_commands.js')

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const DISCORD_TOKEN = process.env.DISCORD_TOKEN
if (DISCORD_TOKEN) {
  require('dotenv').config();
}


console.log(loadAllCommands())

// const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
// try {
//     console.log('Started refreshing application (/) commands.');
//     const commands = loadCommands().map(command => { return { name: command.name, description: command.description } })
//     await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
//     console.log('Successfully reloaded application (/) commands.');
// } catch (error) {
//     console.error(error);
// }
// client.on('ready', () => {
//     console.log(`Logged in as ${client.user.tag}!`);
//   });

//   client.on('interactionCreate', async interaction => {
//     if (!interaction.isChatInputCommand()) return;

//     if (interaction.commandName === 'ping') {
//       await interaction.reply('Pong!');
//     }
//   });

//   client.login(DISCORD_TOKEN);