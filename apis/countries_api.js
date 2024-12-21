module.exports.CountriesAPI = class {

   /**
    * Constructor of the CountriesAPI class
    */
   constructor() {
      this.baseUrl = 'https://countriesnow.space/api/v0.1';
      this.countriesWithStates = null
   }

   /**
    * Initialize the cached data asynchronously
    * @returns {Promise<void>}
    */
   async initialize() {
      try {
         this.countriesWithStates = await this.getCountriesInfos(['name', 'cities']);
      } catch (error) {
         throw new Error('Failed to load countries data:', error);
      }
   }

   /**
    * Get countries infos
    * @returns Array[{name: string, cities: Array[{name: string}]}] Countries
    */
   async getCountriesInfos(infos, retries = 0) {

      if (!infos || !Array.isArray(infos) || infos.length == 0 || infos.some(x => typeof x !== 'string')) {
         throw new Error('infos must be a non-empty array of strings');
      }

      const response = await fetch(`${this.baseUrl}/countries/info?returns=${infos.join(',')}`);

      if (!response.ok && json.code != 200) { // If the response is not ok
         if (retries > 0) {
            return await this.getCountriesInfo(infos, retries - 1);
         }
         throw new Error(JSON.stringify(json));
      }

      // Parse the response as json and return the data
      const data = (await response.json()).data;
      return data.map(x => {
         return {
            "name": x.name,
            "cities": x.cities
         }
      }).sort(x => x.name);
   }

   /**
    * Get countries name
    * @returns Array[string] Countries
    */
   getCountriesName() {
      return this.countriesWithStates.map(x => x.name);
   }

   /**
    * Get countries cities
    * @returns Array[string] States
    */
   getCountryCities(countryName) {
      return this.countriesWithStates.find(x => x.name === countryName)?.cities;
   }
}