const packageJson = require('../../package.json');

const paypalDonationUrl = 'https://www.paypal.com/donate/?hosted_button_id=T94D4G4PY3YT8';

module.exports = {
   primaryColor: '#1FAE8C',
   notifColor: '#FF4C4C',
   prayerColor: '#FFA500',
   quizzColor: '#FFD93D',
   subColor: '#6A4CFF',
   greenColor: '#28A745',
   redColor: '#C92A2A',
   errorColor: '#E53E3E',
   prayerColor: {
      'Fajr': '#FFDDC1',
      'Dhuhr': '#FFD700',
      'Asr': '#FFA500',
      'Maghrib': '#FF4500',
      'Isha': '#1E1E2F'
   },
   githubUrl: 'https://github.com/fivekage/muslimbot',
   topggUrl: 'https://top.gg/bot/1183399354166415481',
   paypalDonationUrl: paypalDonationUrl,
   prayerGif: 'https://i.giphy.com/12ihpr4WmwKJsQ.gif',
   footerText: `${packageJson.version} - MuslimBot 🕋 - For any help type /help command)`
};
