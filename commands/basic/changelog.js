// This command allows users to subscribe/unsubscribe to release notes
// The command is only available for registered users
const logger = require('../../utils/logger.js');
const { usersModel } = require('../../data/models.js');


module.exports.help = {
   name: 'release_notes',
   description: 'Subscribe/Unsubscribe to release notes',
   options: [
      {
         name: 'enable',
         description: 'Enable/Disable release notes',
         type: 5,
         required: true,
         choices: [
            {
               name: 'Enable',
               value: true,
            },
            {
               name: 'Disable',
               value: false,
            },
         ],
      },
   ],
};

module.exports.run = async (_client, interaction) => {
   const [user, created] = await usersModel().findOrBuild({
      where: { userId: interaction.user.id },
      defaults: {
         userId: interaction.user.id,
         subscribedChangelog: true,
      },

   });

   if (created) {
      return logger.info(`New user ${user.userId} created`);
   }

   const value = interaction.options.getBoolean(this.help.options[0].name);
   user.subscribedChangelog = value;
   await user.save();

   return interaction.reply({ content: `You have ${value ? 'subscribed' : 'unsubscribed'} to release notes`, ephemeral: true });
};
