const schedule = require('node-schedule');
const rule = new schedule.RecurrenceRule();
const { Users, Subscriptions, Notifications } = require('../data/models.js');
const { EmbedBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js')
const vars = require('../commands/_general/vars.js')

const schedulePrayerNotifications = (client, subscription, prayer, prayerTime) => {
    const [hours, minutes] = prayerTime.split(':').map(Number);
    const userid = subscription.User.userId
    const userid_db = subscription.UserId
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)

    if(date < new Date()) {
        console.warn(`Prayer ${prayer} already passed for user ${userid}`)
        return
    }
    const actionRow = new ActionRowBuilder({
        components: [
            {
                custom_id: "btn_unsubscribe",
                label: "Unsubscribe",
                style: ButtonStyle.Danger,
                type: ComponentType.Button,
            },
        ],
    })
    schedule.scheduleJob(date, function(p){
        client.users.fetch(userid).then(user => {
            const embed = new EmbedBuilder()
                .setTitle(`${p} 🕌`)
                .setDescription(prayersMessages[p][getRandomInt(prayersMessages[p].length)])
                .setColor(vars.primaryColor)
                .setTimestamp()
                .setFooter({text: 'MuslimBot 🕋 - For any help type /help command'});

            user.send({ embeds: [embed], components: [actionRow] }).catch(error => {
                console.error(`Error during send notification for user ${userid}`, error)
            })

            Notifications().create({ prayer: p, UserId: userid_db, SubscriptionId: subscription.id }).catch(error => {
                console.error(`Error during create notification for user ${userid}`, error)
            })
        })
    }.bind(null,prayer));

    console.log(`Job ${prayer} scheduled at ${date.toLocaleString()} for user ${userid}`);
}

module.exports.schedulePrayers = (client) => {
    rule.hour = 1;
    rule.minute = 0;
    rule.tz = 'Etc/UTC';
    // TEST : rule.minute = new schedule.Range(0, 1); // Todo: change to 0
    const job = schedule.scheduleJob(rule, function(){
        Subscriptions().findAll({ where: { subscriptionEnabled: true }, include: Users() }).then(subscriptions => {
            subscriptions.forEach(subscription => {
                getPrayerTimes(subscription.city).then(prayers => {
                    Object.keys(prayers).forEach(prayer => {
                        if(Object.keys(prayersMessages).includes(prayer)) {
                            const prayerTime = prayers[prayer]
                            schedulePrayerNotifications(client, subscription, prayer, prayerTime)
                        }
                    })
                })
            });
        })
    });

    console.log(`Job ${job.name} scheduled at ${job.nextInvocation()}`);
}

const getPrayerTimes = async (city) => {
    const API_ENDPOINT = `http://api.aladhan.com/v1/timingsByAddress?address=${city}`
    try{
        const response = await fetch(API_ENDPOINT)
        const data = await response.json()
        return data['data']['timings']
    }
    catch(error){
        console.warn("Error during retrieve prayers",error)
        return null
    }
}

const prayersMessages = {
    'Fajr': ["Wake up, it's Fajr time! Begin your day with the remembrance of Allah."],
    'Dhuhr': ["It's Dhuhr time! Take a few minutes to renew your faith.", "Dhuhr is here, take a break from the worldly hustle and reconnect with your Creator."],
    'Asr': ["It's Asr time! Take a few minutes to renew your faith.", "Asr is here, take a break from the worldly hustle and reconnect with your Creator.", "Time for Asr, a peaceful pause in your day for prayer."],
    'Maghrib': ["The sun has set, and it's time for Maghrib. Reflect on your day and thank Allah for His blessings."],
    'Isha': ["Night has fallen, and it's time for Isha. Seek forgiveness and pray for a peaceful night."]
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }