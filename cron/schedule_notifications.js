const schedule = require('node-schedule');
const { EmbedBuilder } = require('discord.js');
const { Op } = require('sequelize');

const { usersModel, subscriptionsModel, notificationsModel } = require('../data/models.js');
const vars = require('../commands/_general/vars.js');
const logger = require('../utils/logger.js');
const { retrievePrayersOfTheDay } = require('../utils/retrieve_prayers.js');
const { sleep } = require('../utils/sleep.js');
const { prayersMessages, getPrayerMessage } = require('../utils/prayers_messages.js');
// Store job scheduled for each user
const jobsScheduled = {};

const schedulePrayerNotifications = async (client, subscription, prayer, prayerDateTime, isRamadan, isEidUlFitr) => {
   const userid = subscription.User.userId;
   const NotificationsCtor = notificationsModel();
   const currentDate = new Date();

   if (prayerDateTime < currentDate) return;

   // Set the time to the start of the day (midnight)
   currentDate.setHours(0, 0, 0, 0);

   // Check if the notification is already scheduled
   if (jobsScheduled[userid]?.includes(prayer)) {
      return;
   }
   // Schedule notification
   schedule.scheduleJob(prayerDateTime, ((p, city, country) => {
      client.users.fetch(userid).then((user) => {
         const embed = new EmbedBuilder()
            .setTitle(`🕌 ${p} — ${city}, ${country}`)
            .setColor(vars.prayerColor[prayer] ?? vars.primaryColor)
            .setDescription(`> ⏰ \`${formattedTime}\`\n> 🌙 Remember to pray and stay connected!`)
            .addFields(
               { name: 'Location', value: `${city}, ${country}`, inline: true },
               { name: 'Time (local)', value: `${formattedTime}`, inline: true },
            )
            .setFooter({ text: 'MuslimBot • Stay consistent 🤍' })
            .setTimestamp();

         // Add Ramadan message
         if (isRamadan && p === 'Maghrib') {
            embed.addFields({
               name: 'Saha Ftourk! 🌒',
               value: 'May this Ramadan bring you the utmost in peace and prosperity. 💟',
            });
         }

         // Add Eid Ul Fitr message
         if (isEidUlFitr && p === 'Fajr') {
            embed.addFields({
               name: 'Eid Mubarak! 🌙',
               value: 'May Allah accept your fasts and prayers and shower His blessings upon you and your family. 💟',
            });
         }

         // Send notification then update notification to sent in database and remove job from scheduled jobs
         user.send({ embeds: [embed] })
            .then(() => {
               logger.info(`Notification sent for user ${userid} at ${prayerDateTime} for prayer ${p} located at ${city}, ${country} `);
               // Update notification to sent
               NotificationsCtor.findOne({
                  where: {
                     prayer: p, userId: subscription.userId, subscriptionId: subscription.id, createdAt: { [Op.gt]: currentDate },
                  },
               })
                  .then((notification) => {
                     if (notification) {
                        notification.sent = true;
                        notification.save();
                        jobsScheduled[userid].splice(jobsScheduled[userid].indexOf(p), 1); // Remove prayer from scheduled job
                     } else {
                        logger.warn(`Notification not found for user ${userid}`);
                     }
                  }).catch(() => {
                     logger.error(`Error during update notification for user ${userid} at ${prayerDateTime} for prayer ${p} located at ${city}, ${country} `);
                  });
            })
            .catch(async (error) => {
               if (error.code === 50007 || error.code === 50278) {
                  logger.info(`DM blocked for user ${userid} at ${prayerDateTime} for prayer ${p} located at ${city}, ${country}`);
                  await usersModel().update(
                     { dmBlocked: true },
                     { where: { userId: userid } }
                  );
               }
               else {
                  logger.error(`Cannot send notification to user ${userid} at ${prayerDateTime} for prayer ${p} located at ${city}, ${country}`, error);
               }
            });
      });
   }).bind(null, prayer, subscription.city, subscription.country));

   if (!jobsScheduled[userid]) jobsScheduled[userid] = [];
   jobsScheduled[userid].push(prayer);

   // Create notification if not exists
   const [notification, created] = await NotificationsCtor.findOrCreate({
      where: {
         prayer, userId: subscription.userId, subscriptionId: subscription.id, createdAt: { [Op.gt]: currentDate },
      },
      defaults: {
         prayer,
         userId: subscription.userId,
         subscriptionId: subscription.id,
         sent: false,
         createdAt: new Date(),
      },
   }).catch((error) => {
      logger.error(`Error during create notification for user ${userid}`, error);
   });
   if (created) {
      // created will be true if a new user was created
      logger.info(`Notification ${notification.id} created for user ${userid}`);
   }
};

const dailyCallSchedulePrayers = (client) => {
   const ruleCron = '*/5 * * * *'; // Every 5 minutes
   const job = schedule.scheduleJob(ruleCron, () => {
      schedulePrayersForTheDay(client);
   });

   logger.info(`Job Schedule Prayers ${job.name} scheduled at ${job.nextInvocation()} `);
};

const schedulePrayersForTheDay = async (client) => {
   const userSubscriptions = await subscriptionsModel().findAll({
      where: { subscriptionEnabled: true },
      include: {
         model: usersModel(),
         where: { dmBlocked: false },
         required: true
      }
   });

   for (const subscription of userSubscriptions) {
      //  Very light sleep to avoid Discord rate limits, but faster
      await sleep(100); // 0.1s

      try {
         const prayers = await retrievePrayersOfTheDay(subscription.city, subscription.country, 2, true);
         const isRamadan = isRamadanMonth(prayers);
         const isEidUlFitr = isEidUlFitrEvent(prayers);

         Object.keys(prayers).forEach((prayer) => {
            if (Object.keys(prayersMessages).includes(prayer)) {
               if (!jobsScheduled[subscription.User.userId]) jobsScheduled[subscription.User.userId] = [];

               // 🔹 Ne planifie que si la prière n'est pas déjà programmée
               if (!jobsScheduled[subscription.User.userId].includes(prayer)) {
                  schedulePrayerNotifications(
                     client,
                     subscription,
                     prayer,
                     new Date(prayers[prayer]),
                     isRamadan,
                     isEidUlFitr
                  );
               }
            }
         });
      } catch (error) {
         logger.error(`Error during retrieve prayers for user ${subscription.User.userId} at ${subscription.city}, ${subscription.country}`, error);
      } finally {
         if (jobsScheduled[subscription.User.userId]) {
            logger.debug(
               `Job scheduled for user ${subscription.User.userId} at ${subscription.city}, ${subscription.country}:`,
               jobsScheduled[subscription.User.userId]
            );
         } else {
            logger.debug(`No job scheduled for user ${subscription.User.userId} at ${subscription.city}, ${subscription.country}`);
         }
      }
   }
};

// Handle new subscription
const schedulePrayerNewSubscription = async (client, subscription) => {
   const subscriptionWithUser = await subscriptionsModel().findOne({ where: { id: subscription.id }, include: usersModel() });
   logger.info(`New subscription for user ${subscriptionWithUser.User.userId}`);
   if (!subscriptionWithUser) throw new Error(`Subscription ${subscription.id} not found`);

   try {
      const prayers = await retrievePrayersOfTheDay(subscriptionWithUser.city, subscriptionWithUser.country, 1, true);
      const isRamadan = isRamadanMonth(prayers);
      const isEidUlFitr = isEidUlFitrEvent(prayers);
      Object.keys(prayers).forEach((prayer) => {
         if (Object.keys(prayersMessages).includes(prayer)) {
            const prayerDateTime = new Date(prayers[prayer]);
            schedulePrayerNotifications(client, subscriptionWithUser, prayer, prayerDateTime, isRamadan, isEidUlFitr);
            logger.debug(`Job scheduled for new user ${subscriptionWithUser.User.userId} : `, jobsScheduled[subscriptionWithUser.User.userId]);
         }
      });
   } catch (error) {
      logger.error(`Error during retrieve prayers for new user ${subscriptionWithUser.User.userId}`, error);
   }
};

const isRamadanMonth = (data) => data.hijri.month.number == 9; // 9 is the month of Ramadan
const isEidUlFitrEvent = (data) => data.hijri.holidays[0] == 'Eid-ul-Fitr'; // Constant String for Eid ul Fitr


module.exports = {
   schedulePrayersForTheDay,
   schedulePrayerNewSubscription,
   dailyCallSchedulePrayers,
};
