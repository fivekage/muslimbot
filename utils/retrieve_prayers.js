module.exports.formatDate = async (date = new Date()) => {
  const year = date.toLocaleString('default', {year: 'numeric'});
  const month = date.toLocaleString('default', {
    month: '2-digit',
  });
  const day = date.toLocaleString('default', {day: '2-digit'});

  return [year, month, day].join('-');
};

module.exports.retrievePrayersOfTheDay = async (city, country, retries, iso8601 = true) => new Promise((resolve, reject) => {
  const API_ENDPOINT_PRAYERS = `http://api.aladhan.com/v1/timingsByCity/${this.formatDate(Date.now())}?city=${city}&country=${country}&method=12&iso8601=${iso8601 ? 'true' : 'false'}`;
  fetch(API_ENDPOINT_PRAYERS)
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok || json.code != 200) { // If the response is not ok
          if (retries > 0) {
            resolve(this.retrievePrayersOfTheDay(city, '0', retries - 1, iso8601)); // Retry with country undefined to get the default country and look only for the city
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
