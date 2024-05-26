const { Client, REST, GatewayIntentBits } = require('discord.js');
const log4js = require('log4js');
const { loadAllCommands } = require('./utils/load_commands.js');
const { initializationClient } = require('./utils/initialization_client.js');
const { handleInteraction } = require('./events/handle_interactions.js');
const { handleNewGuild } = require('./events/handle_newguild.js');
const logger = require('./utils/logger.js');
const models = require('./data/models.js');
const { dailyCallSchedulePrayers, schedulePrayersForTheDay } = require('./cron/schedule_notifications.js');
const { dailyCallScheduleHadiths } = require('./cron/schedule_hadiths.js');
const { playQuran } = require('./utils/play_quran.js');
const { synchronizeVersion } = require('./utils/sync_version.js');
require('dotenv').config();

const client = new Client({
   intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.DirectMessageReactions
   ]
});

const { DISCORD_TOKEN } = process.env;
const { CLIENT_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID) {
   logger.error('Please provide a valid token and client id');
   process.exit(1);
}

// Load all commands
const commands = loadAllCommands();
// Initialize database

// Initialize client
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
initializationClient(client, rest, DISCORD_TOKEN, CLIENT_ID, commands).catch(logger.error).then(() => {
   // Initialize database and schedule jobs
   (async (client) => {
      await models.init(client);
      dailyCallSchedulePrayers(client);
      schedulePrayersForTheDay(client);
      dailyCallScheduleHadiths(client);
      synchronizeVersion(client);
   })(client);

   // Play Quran Radio
   playQuran(client);

   // Handle interactions
   handleInteraction(client, commands).catch(logger.error);
   handleNewGuild(client).catch(logger.error);
});

process.on('exit', (code) => {
   log4js.shutdown(() => {
      process.exit(code);
   });
});

process.on('SIGINT', () => {
   process.exit();
});
