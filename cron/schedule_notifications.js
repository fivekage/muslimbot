const schedule = require('node-schedule');
const { EmbedBuilder } = require('discord.js');
const { Op } = require('sequelize');

const { usersModel, subscriptionsModel, notificationsModel } = require('../data/models.js');
const vars = require('../commands/_general/vars.js');
const logger = require('../utils/logger.js');
const { retrievePrayersOfTheDay } = require('../utils/retrieve_prayers.js');
const { sleep } = require('../utils/sleep.js');
const { prayersMessages, getPrayerMessage, footerTexts } = require('../utils/prayers_messages.js');
// Store job scheduled for each user
const jobsScheduled = {};

const schedulePrayerNotifications = async (client, subscription, prayer, prayerDateTime, isRamadan, isEidUlFitr) => {
   const discordUserId = subscription.User.userId;
   const NotificationsCtor = notificationsModel();
   const currentDate = new Date();

   if (prayerDateTime < currentDate) return;

   // Set the time to the start of the day (midnight)
   currentDate.setHours(0, 0, 0, 0);

   // Schedule notification
   schedule.scheduleJob(prayerDateTime, (async (p, city, country) => {
      try {
         const user = await client.users.fetch(discordUserId);
         const randomMessage = getPrayerMessage(p, isRamadan);

         const embed = new EmbedBuilder()
            .setColor(vars.prayerColor[p] ?? vars.primaryColor)
            .setTitle(`🕌 ${p}`)
            .setDescription(`
               **${randomMessage}**\n
               🤲 *May Allah accept your prayer.*`
            )
            .setFooter({ text: `${footerTexts[p] ?? "Stay consistent 🤍"} • MuslimBot` })
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
               logger.info(`Notification sent for user ${discordUserId} at ${prayerDateTime} for prayer ${p} located at ${city}, ${country} `);
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
                        const index = jobsScheduled[discordUserId].indexOf(p);
                        if (index !== -1) {
                           jobsScheduled[discordUserId].splice(index, 1);
                        }
                     } else {
                        logger.warn(`Notification not found for user ${discordUserId}`);
                     }
                  }).catch(() => {
                     logger.error(`Error during update notification for user ${discordUserId} at ${prayerDateTime} for prayer ${p} located at ${city}, ${country} `);
                  });
            })
            .catch(async (error) => {
               if (error.code === 50007 || error.code === 50278) {
                  logger.info(`DM blocked for user ${discordUserId} at ${prayerDateTime} for prayer ${p} located at ${city}, ${country}`);
                  await usersModel().update(
                     { dmBlocked: true },
                     { where: { userId: discordUserId } }
                  );
               }
               else {
                  logger.error(`Cannot send notification to user ${discordUserId} at ${prayerDateTime} for prayer ${p} located at ${city}, ${country}`, error);
               }
            });
      } catch (error) {
         logger.error(`Error during send notification for user ${discordUserId} at ${prayerDateTime} for prayer ${p} located at ${city}, ${country}`, error);
      }
   }).bind(null, prayer, subscription.city, subscription.country));

   if (!jobsScheduled[discordUserId]) jobsScheduled[discordUserId] = [];
   jobsScheduled[discordUserId].push(prayer);

   // Create notification if not exists
   let notification, created;
   try {
      [notification, created] = await NotificationsCtor.findOrCreate({
         where: {
            prayer,
            userId: subscription.userId,
            subscriptionId: subscription.id,
            createdAt: { [Op.gt]: currentDate },
         },
         defaults: {
            prayer,
            userId: subscription.userId,
            subscriptionId: subscription.id,
            sent: false,
            createdAt: new Date(),
         },
      });

      if (created) {
         logger.info(`Notification ${notification.id} created for user ${discordUserId}`);
      }
   } catch (error) {
      logger.error(`Error during create notification for user ${discordUserId}`, error);
   }
};

const dailyCallSchedulePrayers = (client) => {
   const ruleCron = '*/30 * * * *'; // Every 5 minutes
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
      //  Sleep to avoid Discord rate limits
      await sleep(500); // 0.5s

      const discordUserId = subscription.User.userId;

      try {
         const prayers = await retrievePrayersOfTheDay(subscription.city, subscription.country, 2, true);
         const isRamadan = isRamadanMonth(prayers);
         const isEidUlFitr = isEidUlFitrEvent(prayers);

         Object.keys(prayers).forEach((prayer) => {
            if (Object.keys(prayersMessages).includes(prayer)) {
               if (!jobsScheduled[discordUserId]) jobsScheduled[discordUserId] = [];

               // 🔹 Ne planifie que si la prière n'est pas déjà programmée
               if (!jobsScheduled[discordUserId].includes(prayer)) {
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
         logger.error(`Error during retrieve prayers for user ${discordUserId} at ${subscription.city}, ${subscription.country}`, error);
      } finally {
         if (jobsScheduled[discordUserId]) {
            logger.debug(
               `Job scheduled for user ${discordUserId} at ${subscription.city}, ${subscription.country}:`,
               jobsScheduled[discordUserId]
            );
         } else {
            logger.debug(`No job scheduled for user ${discordUserId} at ${subscription.city}, ${subscription.country}`);
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
            schedulePrayerNotifications(client, subscriptionWithUser, prayer, new Date(prayers[prayer]), isRamadan, isEidUlFitr);
            logger.debug(`Job scheduled for new user ${subscriptionWithUser.User.userId} : `, jobsScheduled[subscriptionWithUser.User.userId]);
         }
      });
   } catch (error) {
      logger.error(`Error during retrieve prayers for new user ${subscriptionWithUser.User.userId}`, error);
   }
};

const isRamadanMonth = (data) => data?.hijri?.month?.number === 9; // 9 is the month of Ramadan
const isEidUlFitrEvent = (data) => data?.hijri?.holidays?.[0] === 'Eid-ul-Fitr';; // Constant String for Eid ul Fitr


module.exports = {
   schedulePrayersForTheDay,
   schedulePrayerNewSubscription,
   dailyCallSchedulePrayers,
};
