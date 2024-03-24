const { EmbedBuilder } = require('discord.js');
const { versionsModel, usersModel } = require('../data/models.js');
const logger = require('./logger.js');
const vars = require('../commands/_general/vars.js');

module.exports = {
   synchronizeVersion: async (client) => {
      const version = require('../package.json').version;

      // Get the changelog file as markdown
      const changelog = require('fs').readFileSync('changelog.md', 'utf8').split('---');
      const latestChangelog = changelog[changelog.length - 1];

      // Filter changelog to get only the latest version
      // Check if the version exists in the database, if not, create it
      await versionsModel().findOrBuild({
         where: { versionNumber: version },
         defaults: {
            changelog: latestChangelog,
            versionNumber: version,
         },
      })
         .then(async ([version, created]) => {
            if (created) {
               logger.info(`New version ${version.versionNumber} created`);

               // Send the changelog to all users who have subscribed to the changelog
               await usersModel().findAll({
                  where: { subscribedChangelog: true },
               }).then(async (users) => {
                  for (const user of users) {
                     const member = await client.users.fetch(user.userId);
                     if (member) {
                        const embed = new EmbedBuilder()
                           .setTitle('**New version has been Released !**')
                           .setDescription(latestChangelog)
                           .setAuthor({ name: 'MuslimBot' })
                           .addFields([
                              { name: 'Thank you 🙏', value: `Don't forget to support us on: [Top.gg](${vars.topggUrl})` },
                              { name: 'Support', value: `If you have any questions or need help, please open an issue on [GitHub](${vars.githubUrl})` },
                           ])
                           .setColor(vars.primaryColor)
                           .setFooter({ text: 'MuslimBot 🕋 - Type the command "/release_notes" to enable/disable notifications of patch notes' });

                        member.send({
                           embeds: [embed],
                        });
                     }
                  }

                  logger.info(`Sent changelog to ${users.length} users`);
               });

               // Save it to the database
               version.save();
            }
            return [version, created];
         })
         .catch((error) => {
            logger.error(`Error while fetching versions: ${error}`);
            return [null, false];
         });
   },
};
