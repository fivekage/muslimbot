const fs = require('fs');
const logger = require('./logger.js');

module.exports.retrieveQuranVerses = () => {
	const folderPath = './quran'; // Adjust the path accordingly

	try {
		// Read the files in the folder
		const files = fs.readdirSync(folderPath);
		// Filter out only the mp3 files
		const audioFiles = files.filter((file) => file.endsWith('.ogg'));

		return audioFiles;
	} catch (err) {
		logger.fatal('Error reading quran directory:', err);
	}
};
