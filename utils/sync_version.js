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
               })
                  .then(async (users) => {
                     for (const user of users) {
                        const member = await client.users.fetch(user.userId);
                        if (member) {
                           const releaseUrl = `${vars.githubUrl}/releases/tag/v${version.versionNumber}`;
                           const embed = new EmbedBuilder()
                              .setTitle('**New version has been Released !**')
                              .setDescription(`You can find the details of the new version in the changelog [here](${releaseUrl})`)
                              .setAuthor({ name: 'MuslimBot' })
                              .addFields([
                                 { name: 'Thank you 🙏', value: `If you like the bot, please leave a vote and a review on: [Top.gg](${vars.topggUrl})` },
                                 { name: 'Donation', value: `If you want to support the project, you can make a [Donation](${vars.paypalDonationUrl})` },
                                 { name: 'Support', value: `If you have any questions or need help, please open an issue on [GitHub](${vars.githubUrl}/issues)` },
                              ])
                              .setColor(vars.primaryColor)
                              .setFooter({ text: 'MuslimBot 🕋 - Type the command "/release_notes" to enable/disable notifications of patch notes' });

                           member.send({
                              embeds: [embed],
                           }).catch((error) => {
                              logger.warn(`Error while sending changelog to ${member.username} - ${error}`);
                           });
                        }
                     }
                     logger.info(`Sent changelog to ${users.length} users`);
                  })
                  .catch((error) => {
                     logger.error(`Error while fetching users: ${error}`);
                  });

               // Save it to the database
               await version.save().catch((error) => {
                  logger.error(`Error while saving version ${version.versionNumber} - ${error}`);
               });
            }
            return [version, created];
         })
         .catch((error) => {
            logger.error(`Error while fetching versions: ${error}`);
            return [null, false];
         });
   },
};
