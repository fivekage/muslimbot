const schedule = require('node-schedule');
const { EmbedBuilder } = require('discord.js');
const { Op } = require('sequelize');
const { usersModel, subscriptionsModel, notificationsModel } = require('../data/models.js');
const vars = require('../commands/_general/vars.js');
const logger = require('../utils/logger.js');
const { retrievePrayersOfTheDay } = require('../utils/retrieve_prayers.js');
const { sleep } = require('../utils/sleep.js');
const { getRandomInt } = require('../utils/random_int.js');
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
            .setTitle(`${prayer} ☪️ - ${subscription.city}, ${subscription.country}`)
            .setDescription("`" + getPrayerMessage(prayer, isRamadan) + "`")
            .setAuthor({ name: 'MuslimBot 🕋', iconURL: user.avatarURL() })
            .setThumbnail(vars.prayerGif)
            .setColor(vars.primaryColor)
            .setURL(vars.topggUrl)
            .setFooter({ text: `${require('../package.json').version} - Please support us 👍 - Command /help for all your need` });


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
            .catch((error) => {
               logger.error(`Cannot send notification to user ${userid} at ${prayerDateTime} for prayer ${p} located at ${city}, ${country} `, error);
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
   const ruleCron = process.env.PRAYER_SCHEDULE_CRON ?? '0 * * * *'; // Every hour;
   const job = schedule.scheduleJob(ruleCron, () => {
      schedulePrayersForTheDay(client);
   });

   logger.info(`Job Schedule Prayers ${job.name} scheduled at ${job.nextInvocation()} `);
};

const schedulePrayersForTheDay = async (client) => {
   const userSubscriptions = await subscriptionsModel().findAll({ where: { subscriptionEnabled: true }, include: usersModel() })
   for (const subscription of userSubscriptions) {
      await sleep(1 * 1000); // Sleep 1 second to avoid rate limit
      retrievePrayersOfTheDay(subscription.city, subscription.country, 2, true)
         .then((prayers) => {
            const isRamadan = isRamadanMonth(prayers);
            const isEidUlFitr = isEidUlFitrEvent(prayers);

            Object.keys(prayers).forEach((prayer) => {
               if (Object.keys(prayersMessages).includes(prayer)) {
                  schedulePrayerNotifications(client, subscription, prayer, new Date(prayers[prayer]), isRamadan, isEidUlFitr);
               }
            });
         })
         .catch((error) => {
            logger.error(`Error during retrieve prayers for user ${subscription.User.userId} located at ${subscription.city}, ${subscription.country}.`, error);
         })
         .finally(() => {
            if (jobsScheduled[subscription.User.userId]) {
               logger.debug(`Job scheduled for user ${subscription.User.userId} located at ${subscription.city}, ${subscription.country}: `, jobsScheduled[subscription.User.userId]);
            } else {
               logger.debug(`No job scheduled for user ${subscription.User.userId} located at ${subscription.city}, ${subscription.country} `);
            }
         });
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

const getPrayerMessage = (prayer, isRamadan) => {
   if (isRamadan) {
      if (['Fajr', 'Maghrib'].includes(prayer)) {
         return ramadanMessage[prayer][getRandomInt(ramadanMessage[prayer].length)];
      }
   }
   return prayersMessages[prayer][getRandomInt(prayersMessages[prayer].length)];
};

const isRamadanMonth = (data) => data.hijri.month.number == 9; // 9 is the month of Ramadan
const isEidUlFitrEvent = (data) => data.hijri.holidays[0] == 'Eid-ul-Fitr'; // Constant String for Eid ul Fitr

const prayersMessages = {
   Fajr: [
      'Embrace the tranquility of Fajr prayer and start your day with a peaceful heart.',
      'The world is still, and it\'s Fajr time. Begin your day with devotion and gratitude.',
      'The dawn breaks, and Fajr prayer beckons. Begin your day with devotion and humility.',
      'As the world awakens, answer the call of Fajr prayer with a heart full of gratitude.',
   ],

   Dhuhr: [
      'Pause for Dhuhr prayer, renew your intentions, and seek Allah\'s guidance.',
      'Dhuhr prayer is an opportunity to reset your focus and find strength in prayer.',
      'In the stillness of Dhuhr, take a moment to reflect and reconnect with your Creator.',
      'Dhuhr is more than a prayer; it\'s a conversation with Allah, a moment of introspection.',
   ],

   Asr: [
      'Asr is a moment to center yourself and find solace in prayer.',
      'Asr prayer is a reminder to take a spiritual break amidst life\'s demands.',
      'Amidst the afternoon\'s hustle, pause for Asr prayer—a sanctuary for the soul.',
      'Asr prayer is a gentle reminder in the midst of life\'s chaos—find solace in prayer.',
      'Amidst the afternoon\'s hustle, pause for Asr prayer—a sanctuary for the soul.',
   ],

   Maghrib: [
      'As the day concludes, Maghrib prayer offers a chance for reflection and gratitude.',
      'Witness the beauty of Maghrib and express thanks for the day\'s blessings.',
      'With the setting sun comes Maghrib, a time to reflect on the day\'s journey.',
      'Maghrib prayer is a bridge between day and night—a moment to express gratitude.',
   ],

   Isha: [
      'Embrace the stillness of the night with Isha prayer. Seek forgiveness and peace.',
      'Night has fallen, and Isha is an intimate conversation with Allah.',
      'Under the night sky, embrace the tranquility of Isha prayer. Seek peace within.',
      'As the stars emerge, let Isha prayer guide you to a serene and reflective state.',
   ],
};

const ramadanMessage = {
   Fajr: [
      'As the sun rises on another day of Ramadan, may your Fajr prayer ignite your spirit and guide you through this blessed month.',
      'At Fajr, embrace the serenity of Ramadan. Let this prayer be the start of a day filled with blessings and gratitude.',
      'With the dawn of Fajr, may your heart be filled with hope and your spirit strengthened for the day ahead in this blessed month of Ramadan.',
      'As you rise for Fajr in Ramadan, may Allah shower His blessings upon you and fill your day with peace and joy.',
      'In the quiet moments of Fajr during Ramadan, let your prayers rise like incense, filling your day with divine blessings.',
      'With the call of Fajr in Ramadan, may your heart find solace and your soul be uplifted by the beauty of this blessed month.',
      'As the stars fade and the world awakens to Fajr prayer in Ramadan, may your devotion deepen and your faith grow stronger.',
   ],
   Maghrib: [
      'As twilight descends and the stars begin to emerge, let your Maghrib prayer in Ramadan be a symphony of gratitude for Allah\'s blessings.',
      'With the call of Maghrib, let the colors of the sunset remind you of Allah\'s mercy and grace, embracing you in the warmth of His love.',
      'As the day transitions to night, may your Maghrib prayer in Ramadan be a moment of reflection, where you seek forgiveness and guidance for the journey ahead.',
      'At Maghrib, as the world pauses to witness the beauty of dusk, let your prayers ascend to the heavens, carrying your hopes and aspirations for this blessed month.',
      'As the day\'s hustle fades into the tranquility of the evening, embrace the serenity of Maghrib prayer and find solace in Allah\'s grace.',
      'With the twilight sky as your witness, let your Maghrib prayer be a moment of introspection, where you find peace in the silence of your soul.',
      'As dusk settles and the world slows down, let your Maghrib prayer be a symphony of gratitude, filling the air with whispers of thankfulness.',
      'At Maghrib, as the sun bids adieu, let your heart bloom like the flowers at sunset, blossoming with faith and devotion.',
      'With the setting of the sun comes the rising of your spirit. Let your Maghrib prayer be a beacon of light in the darkness, guiding you closer to Allah.',
   ],
};

module.exports = {
   schedulePrayersForTheDay,
   schedulePrayerNewSubscription,
   dailyCallSchedulePrayers,
};
