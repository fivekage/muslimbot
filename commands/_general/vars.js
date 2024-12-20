const packageJson = require('../../package.json');

const paypalDonationUrl = 'https://www.paypal.com/donate/?hosted_button_id=T94D4G4PY3YT8';

module.exports = {
   primaryColor: '#FFD700',
   greenColor: '#008000',
   redColor: '#DB0109',
   errorColor: '#FF0000',
   githubUrl: 'https://github.com/fivekage/muslimbot',
   topggUrl: 'https://top.gg/bot/1183399354166415481',
   paypalDonationUrl: paypalDonationUrl,
   prayerGif: 'https://i.giphy.com/12ihpr4WmwKJsQ.gif',
   footerText: `${packageJson.version} - MuslimBot 🕋 - For any help type /help command)`
};
