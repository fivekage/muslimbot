const fs = require('fs');
const logger = require('./logger.js')


module.exports.retrieveQuranVerses = () => {
    const folderPath = './quran'; // Adjust the path accordingly

    try {
        // Read the files in the folder
        const files = fs.readdirSync(folderPath);
        // Filter out only the mp3 files
        const mp3Files = files.filter(file => file.endsWith('.mp3'));

        return mp3Files

    } catch (err) {
        logger.fatal('Error reading quran directory:', err);
    }

}