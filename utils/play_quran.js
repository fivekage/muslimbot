const fs = require('fs');
const {
	NoSubscriberBehavior,
	createAudioPlayer,
	createAudioResource,
	entersState,
	AudioPlayerStatus,
	VoiceConnectionStatus,
	joinVoiceChannel,
} = require('@discordjs/voice');
const {retrieveQuranVerses} = require('./retrieve_quran_verses.js');
const logger = require('./logger.js');

const player = createAudioPlayer({
	behaviors: {
		noSubscriber: NoSubscriberBehavior.Pause,
	},
});

module.exports.playQuran = (client = null) => {
	const quranVerses = retrieveQuranVerses();
	const randomVerse = quranVerses[Math.floor(Math.random() * quranVerses.length)];
	const fullPathFile = `./quran/${randomVerse}`;
	const input = fs.createReadStream(fullPathFile, {type: 'ogg/opus'});

	const name = randomVerse.replace('.ogg', '');
	player.play(
		createAudioResource(input, {
			metadata: {
				title: name,
			},
		}),
	);

	if (client != null) {
		client.player = player;
	}
	if (client && client.player != null) {
		client.player.currentResource = name.slice(4, name.length);
	}
};

// Events
player.on('stateChange', (oldState, newState) => {
	logger.debug(`Audio player transitioned from ${oldState.status} to ${newState.status}`);
});

player.on(AudioPlayerStatus.Playing, (test) => {
	logger.info(`Audio player is playing ${test.resource.metadata.title}`);
});

player.on(AudioPlayerStatus.Idle, (test) => {
	logger.info(`Audio player is playing ${test.resource.metadata.title}`);
	logger.info('Playback has stopped. Playing another surah.');
	this.playQuran();
});

player.on('error', (error) => {
	logger.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
	this.playQuran();
});

module.exports.connectToChannel = async (channel) => {
	const connection = joinVoiceChannel({
		channelId: channel.id,
		guildId: channel.guild.id,
		adapterCreator: channel.guild.voiceAdapterCreator,
	});
	try {
		await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
		// Close connection on disconnect
		connection.on('stateChange', (_oldState, newState) => {
			if (newState.status === VoiceConnectionStatus.Disconnected) {
				try {
					connection.destroy();
					logger.info('Connection destroyed on:', connection.joinConfig.channelId);
				} catch (error) {
					logger.error(error);
				}
			}
		});
		logger.info('New connection on:', connection.joinConfig.channelId);
		return connection;
	} catch (error) {
		connection.destroy();
		throw error;
	}
};
