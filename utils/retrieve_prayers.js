module.exports.retrievePrayersOfTheDay = async (city, country, retries, iso8601 = true) => await new Promise(async (resolve, reject) => {
   const API_ENDPOINT_PRAYERS = `http://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=12&iso8601=${iso8601 ? 'true' : 'false'}`;
   fetch(API_ENDPOINT_PRAYERS)
      .then(async (response) => {
         const json = await response.json();
         if (!response.ok || json.code != 200) { // If the response is not ok
            if (retries > 0) {
               // Retry with country undefined to get the default country and look only for the city
               resolve(
                  this.retrievePrayersOfTheDay(city, '0', retries - 1, iso8601),
               );
            }
            throw new Error(json.data ?? 'Location not found');
         }

         return json.data;
      })
      .then(async (response) => {
         resolve({
            ...response.timings,
            ...response.meta,
            ...response.date,
         });
      })
      .catch((error) => {
         reject(error);
      });
});
