const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { versionsModel, usersModel } = require('../data/models.js');
const logger = require('./logger.js');
const vars = require('../commands/_general/vars.js');

module.exports = {
   synchronizeVersion: async (client) => {
      const version = require('../package.json').version;

      // Get the changelog file as markdown
      const changelog = require('fs').readFileSync('changelog.md', 'utf8').split('---');
      const latestChangelog = changelog[changelog.length - 1];
      const releaseUrl = `${vars.githubUrl}/releases/tag/v${version}`;

      const embed = new EmbedBuilder()
         .setTitle(`🆕 New Version v${version}`)
         .setDescription(`
            Click the button below to view the full changelog on GitHub.\n\n
            ℹ️ To enable or disable notifications for future release notes, use the **/release_notes** command.`)
         .setColor(vars.primaryColor)
         .setFooter({ text: 'MuslimBot 🕋 - Click the buttons to interact' })
         .setTimestamp();

      const viewButton = new ButtonBuilder()
         .setLabel('View Changelog')
         .setStyle(ButtonStyle.Link)
         .setURL(releaseUrl);

      const donateButton = new ButtonBuilder()
         .setLabel('Donate ❤️')
         .setStyle(ButtonStyle.Link)
         .setURL(vars.paypalDonationUrl)

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
                        const row = new ActionRowBuilder().addComponents(viewButton, donateButton);

                        await member.send({ embeds: [embed], components: [row] });
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
