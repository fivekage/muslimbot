// prayers_messages.js
const { getRandomInt } = require('./random_int.js');

const prayersMessages = {
   Fajr: [
      'The horizon awakens, and so does your soul. Begin Fajr with gratitude and hope.',
      'As the first light touches the earth, let your heart rise in devotion and serenity.',
      'Fajr is the gentle whisper of a new day—pause, reflect, and connect with your Creator.',
      'Step into the dawn with a peaceful mind and a spirit ready for blessings.',
      'Let the cool morning air remind you of the endless mercy and beauty in life.',
   ],

   Dhuhr: [
      'Pause in the middle of your day and let Dhuhr prayer refresh your mind and spirit.',
      'Amidst daily tasks, take a moment to reconnect with the One who guides you.',
      'Dhuhr is a gentle reset button—reflect, pray, and regain clarity.',
      'In the calm of midday, lift your thoughts to gratitude and intention.',
      'Let Dhuhr be your sanctuary amidst the noise of the day.',
   ],

   Asr: [
      'The afternoon sun is high, but your soul seeks stillness—embrace Asr prayer.',
      'Asr is a brief pause, a bridge between work and reflection.',
      'Step away from the world’s rush and find your inner calm through prayer.',
      'Even in the busyness of life, Asr reminds you to breathe and be present.',
      'The late sun invites you to reconnect with your heart and purpose.',
   ],

   Maghrib: [
      'The sun bows to the horizon; let your gratitude rise in Maghrib prayer.',
      'As the sky glows, reflect on the day and offer thanks for its lessons.',
      'Maghrib is a gentle closure—a time to let go and seek peace.',
      'Witness the sunset and let your prayer illuminate your evening.',
      'The transition from day to night is perfect for reflection and connection.',
   ],

   Isha: [
      'Under the night sky, Isha invites you to inner peace and contemplation.',
      'Let the stars remind you of divine vastness as you seek serenity in prayer.',
      'Isha is the quiet conversation of the soul with the Divine.',
      'End your day with reflection, forgiveness, and hope for tomorrow.',
      'In the calm of night, find your spiritual anchor and serenity.',
   ],
};

const ramadanMessage = {
   Fajr: [
      'May your Fajr in Ramadan inspire your heart and illuminate your path all day.',
      'Let the dawn of Ramadan fill you with devotion, gratitude, and hope.',
      'Rise with Fajr and let your prayers become a source of light and peace.',
      'Embrace the stillness of Fajr during Ramadan and let it guide your soul.',
      'With the first light, may your spirit awaken to the blessings of this holy month.',
   ],

   Maghrib: [
      'As the day’s fast ends, let Maghrib be a symphony of gratitude and joy.',
      'The sunset whispers Allah’s mercy—reflect, thank, and rejoice in Ramadan.',
      'Maghrib in Ramadan is a sacred pause—let your heart overflow with prayer.',
      'As the sky darkens, may your devotion shine brighter than the fading sun.',
      'End the day with gratitude, reflection, and the serenity of divine love.',
   ],
};

const footerTexts = {
   Fajr: "Begin with intention 🤍",
   Dhuhr: "Pause & reconnect 🌿",
   Asr: "Stay mindful ✨",
   Maghrib: "Reflect with gratitude 🌇",
   Isha: "End with serenity 🌙",
};

// Helper function to get a random message for a prayer
const getPrayerMessage = (prayer, isRamadan = false) => {
   if (isRamadan && ramadanMessage[prayer]) {
      const msgs = ramadanMessage[prayer];
      return msgs[getRandomInt(msgs.length)];
   }
   if (prayersMessages[prayer]) {
      const msgs = prayersMessages[prayer];
      return msgs[getRandomInt(msgs.length)];
   }
   return 'May your prayer bring peace and guidance.';
};

module.exports = { prayersMessages, ramadanMessage, getPrayerMessage, footerTexts };