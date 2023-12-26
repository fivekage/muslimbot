const { Player, Track, QueryType } = require('discord-player');
const { retrieveQuranVerses } = require('./retrieve_quran_verses.js')
const logger = require('./logger.js')

module.exports.playQuran = async (client) => {
    const sharedAudioPlayer = new Player(client);

    logger.debug("Loading quran player")
    await sharedAudioPlayer.extractors.loadDefault(e => e === "AttachmentExtractor");

    const quranVerses = retrieveQuranVerses();
    const randomVerse = quranVerses[Math.floor(Math.random() * quranVerses.length)]
    const fullPathFile = `./quran/${randomVerse}`

    sharedAudioPlayer.events.on('playerStart', (queue, track) => {
        logger.debug(`Started playing **${track.title}**!`);
    });

    sharedAudioPlayer.events.on('disconnect', (queue) => {
        logger.debug(`Disconnected!`);
    });


    try {

        // const track = new Track(sharedAudioPlayer, {
        //     searchEngine: QueryType.FILE,
        //     queue: false,
        //     nodeOptions: {
        //         // nodeOptions are the options for guild node (aka your queue in simple word)
        //         metadata: null // we can access this metadata object using queue.metadata later on
        //     }
        // })
        logger.debug("Quran player loaded")

    } catch (e) {
        // let's return error if something failed
        throw new Error(`Something went wrong: ${e}`)
    }
}



