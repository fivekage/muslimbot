const { AladhanAPI } = require('./aladhan_api.js');


module.exports.retrievePrayersOfTheDay = async (city, country, retries, iso8601 = true) => await new Promise((resolve, reject) => {
   const aladhanAPIObj = new AladhanAPI();
   aladhanAPIObj.getPrayerTimes(city, country, retries, iso8601)
      .then((response) => {
         resolve(response);
      })
      .catch((error) => {
         reject(error);
      });
});
