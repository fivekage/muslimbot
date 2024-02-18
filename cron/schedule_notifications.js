const schedule = require('node-schedule');
const { Users, Subscriptions, Notifications } = require('../data/models.js');
const { EmbedBuilder } = require('discord.js')
const vars = require('../commands/_general/vars.js')
const logger = require('../utils/logger.js')
const { Op } = require('sequelize')
const { retrievePrayersOfTheDay } = require('../utils/retrieve_prayers.js')
// Store job scheduled for each user
const jobScheduled = {}

const schedulePrayerNotifications = async (client, subscription, prayer, prayerDateTime) => {
    const userid = subscription.User.userId
    const NotificationsCtor = Notifications()
    const currentDate = new Date();

    if (prayerDateTime < currentDate) return;


    // Set the time to the start of the day (midnight)
    currentDate.setHours(0, 0, 0, 0);

    // Check if the notification is already scheduled
    if (jobScheduled[userid] && jobScheduled[userid].includes(prayer)) {
        return
    }

    // Schedule notification
    schedule.scheduleJob(prayerDateTime, function (p) {
        client.users.fetch(userid).then(user => {
            const embed = new EmbedBuilder()
                .setTitle(`${p} 🕌`)
                .setDescription(prayersMessages[p][getRandomInt(prayersMessages[p].length)])
                .setColor(vars.primaryColor)
                .setTimestamp()
                .setFooter({ text: 'MuslimBot 🕋 - For any help type /help command' });

            user.send({ embeds: [embed] }).catch(error => {
                logger.error(`Error during send notification for user ${userid}`, error)
            })

            // Update notification to sent
            NotificationsCtor.findOne({ where: { prayer: p, UserId: subscription.UserId, SubscriptionId: subscription.id, createdAt: { [Op.gt]: currentDate } } })
                .then(notification => {
                    if (notification) {
                        notification.sent = true
                        notification.save()
                        logger.info(`Notification ${notification.id} sent for user ${userid}`)
                        jobScheduled[userid].splice(jobScheduled[userid].indexOf(p), 1) // Remove prayer from scheduled job
                    } else {
                        logger.warn(`Notification not found for user ${userid}`)
                    }
                }).catch(() => {
                    logger.error(`Error during update notification for user ${userid}`)
                    subscription.subscriptionEnabled = false // Disable subscription, user not reachable, he has probably blocked the bot or something like that
                    subscription.save()
                })
        })
    }.bind(null, prayer));

    if (!jobScheduled[userid]) jobScheduled[userid] = []
    jobScheduled[userid].push(prayer)


    // Create notification if not exists
    const [notification, created] = await NotificationsCtor.findOrCreate({
        where: { prayer: prayer, UserId: subscription.UserId, SubscriptionId: subscription.id, createdAt: { [Op.gt]: currentDate } },
        defaults: {
            prayer: prayer,
            UserId: subscription.UserId,
            SubscriptionId: subscription.id,
            sent: false,
            createdAt: new Date()
        }
    }).catch(error => {
        logger.error(`Error during create notification for user ${userid}`, error)
    })
    if (created) {
        // created will be true if a new user was created
        logger.info(`Notification ${notification.id} created for user ${userid}`)
    }
}

const dailyCallSchedulePrayers = (client) => {
    const ruleCron = process.env.PRAYER_SCHEDULE_CRON ?? '0 */2 * * *' // Every 2 hours;
    const job = schedule.scheduleJob(ruleCron, function () {
        schedulePrayersForTheDay(client)
    });

    logger.info(`Job Schedule Prayers ${job.name} scheduled at ${job.nextInvocation()}`);
}

const schedulePrayersForTheDay = (client) => {
    Subscriptions().findAll({ where: { subscriptionEnabled: true }, include: Users() }).then(subscriptions => {
        subscriptions.forEach(subscription => {
            retrievePrayersOfTheDay(subscription.city, subscription.country, true)
                .then(prayers => {
                    Object.keys(prayers).forEach(prayer => {
                        if (Object.keys(prayersMessages).includes(prayer)) {
                            const prayerDateTime = new Date(prayers[prayer])
                            schedulePrayerNotifications(client, subscription, prayer, prayerDateTime)
                        }
                    })
                })
                .catch(error => {
                    logger.error(`Error during retrieve prayers for user ${subscription.User.userId}`, error)
                })
                .finally(() => {
                    logger.debug(`Job scheduled for user ${subscription.User.userId} :`, jobScheduled[subscription.User.userId])
                })
        });
    })
}

// Handle new subscription
const schedulePrayerNewSubscription = async (client, subscription) => {
    const subscriptionWithUser = await Subscriptions().findOne({ where: { id: subscription.id }, include: Users() })
    logger.info(`New subscription for user ${subscriptionWithUser.User.userId}`)
    if (!subscriptionWithUser) throw new Error(`Subscription ${subscription.id} not found`)

    const prayers = await retrievePrayersOfTheDay(subscriptionWithUser.city, subscriptionWithUser.country, true)
    Object.keys(prayers).forEach(prayer => {
        if (Object.keys(prayersMessages).includes(prayer)) {
            const prayerDateTime = new Date(prayers[prayer])
            schedulePrayerNotifications(client, subscriptionWithUser, prayer, prayerDateTime)
        }
    })
}

const prayersMessages = {
    'Fajr': [
        "Embrace the tranquility of Fajr prayer and start your day with a peaceful heart.",
        "The world is still, and it's Fajr time. Begin your day with devotion and gratitude.",
        "The dawn breaks, and Fajr prayer beckons. Begin your day with devotion and humility.",
        "As the world awakens, answer the call of Fajr prayer with a heart full of gratitude."
    ],

    'Dhuhr': [
        "Pause for Dhuhr prayer, renew your intentions, and seek Allah's guidance.",
        "Dhuhr prayer is an opportunity to reset your focus and find strength in prayer.",
        "In the stillness of Dhuhr, take a moment to reflect and reconnect with your Creator.",
        "Dhuhr is more than a prayer; it's a conversation with Allah, a moment of introspection."
    ],

    'Asr': [
        "Asr is a moment to center yourself and find solace in prayer.",
        "Asr prayer is a reminder to take a spiritual break amidst life's demands.",
        "Amidst the afternoon's hustle, pause for Asr prayer—a sanctuary for the soul.",
        "Asr prayer is a gentle reminder in the midst of life's chaos—find solace in prayer.",
        "Amidst the afternoon's hustle, pause for Asr prayer—a sanctuary for the soul.",
    ],

    'Maghrib': [
        "As the day concludes, Maghrib prayer offers a chance for reflection and gratitude.",
        "Witness the beauty of Maghrib and express thanks for the day's blessings.",
        "With the setting sun comes Maghrib, a time to reflect on the day's journey.",
        "Maghrib prayer is a bridge between day and night—a moment to express gratitude."
    ],

    'Isha': [
        "Embrace the stillness of the night with Isha prayer. Seek forgiveness and peace.",
        "Night has fallen, and Isha is an intimate conversation with Allah.",
        "Under the night sky, embrace the tranquility of Isha prayer. Seek peace within.",
        "As the stars emerge, let Isha prayer guide you to a serene and reflective state."
    ]
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

module.exports = {
    schedulePrayersForTheDay,
    schedulePrayerNewSubscription,
    dailyCallSchedulePrayers
}

