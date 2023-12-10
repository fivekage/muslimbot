const { Client, REST, GatewayIntentBits } = require('discord.js')
const { loadAllCommands } = require('./utils/load_commands.js')
const { initializationClient } = require('./utils/initialization_client.js')
const { handleInteraction } = require('./utils/handle_interactions.js')
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const DISCORD_TOKEN = process.env.DISCORD_TOKEN
const CLIENT_ID = process.env.CLIENT_ID
if (!DISCORD_TOKEN || !CLIENT_ID) {
    console.error("Please provide a valid token and client id")
    process.exit(1)
}


const commands = loadAllCommands()

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

initializationClient(client, rest, DISCORD_TOKEN, CLIENT_ID, commands).catch(console.error);
handleInteraction(client, commands).catch(console.error);

