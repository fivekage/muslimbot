module.exports.AladhanAPI = class {

   /**
    * Constructor of the AladhanAPI class
    */
   constructor(maxMonthsUpcomingEvents = 3) {
      this.base_url = 'https://api.aladhan.com/v1';
      this.max_months_upcoming_events = maxMonthsUpcomingEvents;
   }

   /**
    * Get the prayer times of the day
    * @param {string} city  The city to look for
    * @param {string} country The country to look for
    * @param {int} retries The number of retries to do if the request fails
    * @param {boolean} iso8601 If the date should be in iso8601 format
    * @returns The prayer times of the day
    */
   async getPrayerTimes(city, country, retries, iso8601 = true) {
      const response = await fetch(`${this.base_url}/timingsByCity?city=${city}&country=${country}&method=12&iso8601=${iso8601 ? 'true' : 'false'}`);

      if (!response.ok && json.code != 200) { // If the response is not ok
         if (retries > 0) {
            // Retry with country undefined to get the default country and look only for the city
            return await this.retrievePrayersOfTheDay(city, '0', retries - 1, iso8601);
         }
         throw new Error(JSON.stringify(json));
      }

      const data = (await response.json()).data;

      return {
         ...data.timings,
         ...data.meta,
         ...data.date,
      }
   }

   /**
    * Get the Islamic current day
    * @returns The Islamic current day
    * @throws An error if the request fails
    * @throws An error if the response is not ok
    */
   async getIslamicCurrentDay() {
      const currentDate = `${new Date().getDay()}-${new Date().getMonth()}-${new Date().getFullYear()}`;
      const response = await fetch(`${this.base_url}/gToH/${currentDate}`);
      const json = await response.json();

      if (!response.ok) { // If the response is not ok
         throw new Error(JSON.stringify(json));
      }

      const data = json.data;
      return {
         date: `${data.hijri.weekday.en} ${data.hijri.day} ${data.hijri.month.en} ${data.hijri.year}`,
         holidays: data.hijri.holidays ?? [],
      };
   }

   /**
    * Get the Islamic calendar by year
    * @param {int} year The gregorian year to look for
    * @returns The Islamic calendar by year
    * @throws An error if the request fails
    * @throws An error if the response is not ok
    * @throws An error if the year is less than 0
    */
   async getIslamicCalendarByYear(year) {
      if (year < 0) {
         throw new Error('Year must be greater than 0');
      }

      const response = await fetch(`${this.base_url}/calendarByCity/${year}/01?country=France&city=Paris&annual=true`);
      const json = await response.json();

      if (!response.ok) { // If the response is not ok
         throw new Error(JSON.stringify(json));
      }

      return json.data;
   }

   /**
    * Get the Islamic upcoming events
    * @param {int} year The year to look for
    * @returns The Islamic upcoming events
    */
   async getIslamicUpcomingEvents() {
      const today = new Date();  // Assume today is December
      const endDate = new Date(today);  // Clone the date
      endDate.setMonth(today.getMonth() + this.max_months_upcoming_events);  // Adjust the month

      const events = [];
      let calendar = await this.getIslamicCalendarByYear(today.getFullYear());

      for (let date = today; date < endDate; date = date.setMonth(date.getMonth() + 1)) {
         // If the month is Janurary, get the next year's calendar
         if (date.getMonth() === 0) { // 0 is January
            calendar = await this.getIslamicCalendarByYear(date.getFullYear());
         }
         let currentMonth = date.getMonth() + 1; // Get the current month
         let currentYear = date.getFullYear(); // Get the current year

         events.push(...this.getEventsForMonth(calendar[currentMonth])); // +1 because the month is in js, january is 0


      }

      return events;
   }

   /**
    * Get the events for a specific month
    * @param {Array} month The month to look for
    * @returns The events for the month
    */
   getEventsForMonth(month) {
      const events = [];
      month.forEach((day) => {
         if (day.date.hijri.holidays.length > 0) {
            events.push({
               hijriDate: day.date.hijri.date,
               gregorianDate: day.date.gregorian.date,
               readableDate: day.date.readable,
               holidays: day.date.hijri?.holidays?.map(x => x.trim().replace('\n', '')) ?? [],
            });

         }
      });
      return events;
   }
}