const schedule = require('node-schedule');
const rule = new schedule.RecurrenceRule();
const { Users, Subscriptions } = require('../data/models.js');

const schedulePrayerNotifications = (client, userid, prayer, prayerTime) => {
    const [hours, minutes] = prayerTime.split(':').map(Number);

    const date = new Date()
    date.setHours(hours, minutes, 0, 0)

    if(date < new Date()) {
        console.warn(`Prayer ${prayer} already passed for user ${userid}`)
        return
    }
    const job = schedule.scheduleJob(date, function(p){
        client.users.fetch(userid).then(user => {
            user.send(`It's time for ${p} prayer!`)
        })
    }.bind(null,prayer));

    console.log(`Job ${prayer} scheduled at ${date.toLocaleString()} for user ${userid}`);
}

module.exports.schedulePrayers = (client) => {
    rule.hour = 1;
    rule.minute = 0;
    rule.tz = 'Etc/UTC';
    //rule.minute = new schedule.Range(0, 59); // Todo: change to 0
    const job = schedule.scheduleJob(rule, function(){
        Subscriptions().findAll({ where: { subscriptionEnabled: true }, include: Users() }).then(subscriptions => {
            subscriptions.forEach(subscription => {
                getPrayerTimes(subscription.city).then(prayers => {
                    Object.keys(prayers).forEach(prayer => {
                        if(prayersToBeNotified.includes(prayer)) {
                            const prayerTime = prayers[prayer]
                            schedulePrayerNotifications(client, subscription.User.userId, prayer, prayerTime)
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

const prayersToBeNotified = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
        