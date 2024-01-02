const { Client, REST, GatewayIntentBits, Intents, } = require('discord.js')
const { loadAllCommands } = require('./utils/load_commands.js')
const { initializationClient } = require('./utils/initialization_client.js')
const { handleInteraction } = require('./utils/handle_interactions.js')
const { handleNewGuild } = require('./utils/handle_newguild.js')
const logger = require('./utils/logger.js')
const models = require('./data/models.js')
const { dailyCallSchedulePrayers, schedulePrayersForTheDay } = require('./utils/schedule_notifications.js')
const { dailyCallScheduleHadiths } = require('./utils/schedule_hadiths.js')
const { playQuran } = require('./utils/play_quran.js')
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, 'GuildVoiceStates'] });

const DISCORD_TOKEN = process.env.DISCORD_TOKEN
const CLIENT_ID = process.env.CLIENT_ID
if (!DISCORD_TOKEN || !CLIENT_ID) {
    logger.error("Please provide a valid token and client id")
    process.exit(1)
}

// Load all commands
const commands = loadAllCommands();
// Initialize database
(async (client) => {
    await models.init(client)
    dailyCallSchedulePrayers(client)
    schedulePrayersForTheDay(client)
    dailyCallScheduleHadiths(client)
})(client)


// Initialize client
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
initializationClient(client, rest, DISCORD_TOKEN, CLIENT_ID, commands).catch(console.error);
playQuran(client)

// Handle interactions
handleInteraction(client, commands).catch(console.error);
handleNewGuild(client).catch(console.error);

