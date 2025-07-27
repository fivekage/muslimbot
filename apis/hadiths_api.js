const { getRandomInt } = require('../utils/random_int.js');
const logger = require('../utils/logger.js');
const assert = require('node:assert/strict');

module.exports.HadithsAPI = class {

   /**
    * Constructor of the HadithAPI class
    */
   constructor() {
      this.baseUrl = 'https://hadithapi.com/api';
      this.apiKey = process.env.HADITH_API_KEY;
      if (!this.apiKey) {
         throw new Error('HADITH_API_KEY environment variable is not set');
      }
      this.hadithsBooks = [
         "sahih-bukhari",
         "sahih-muslim",
         "al-tirmidhi",
         "abu-dawood",
         "ibn-e-majahsunan-nasai",
         "mishkat",
      ];
   }

   /**
    * Get all hadith books from the API
    * @return {Promise<Array>} Array of hadith books
    * */
   async getBooks() {
      const API_ENDPOINT_BOOKS = `${this.baseUrl}/books?apiKey=${this.apiKey}`;
      try {
         const response = await fetch(`${API_ENDPOINT_BOOKS}`, {
            method: 'GET',
            headers: {
               'Content-Type': 'application/json',
            },
         });

         const data = await response.json();
         logger.info('Hadith books retrieved successfully from API');
         return data.books;

      } catch (error) {
         logger.error('Error during retrieve hadith books', error);
         throw error;
      }
   }

   /**
    * Get chapters of a specific book
    * @param {*} book
    * @returns Array of chapters
    * */
   async getChapters(book) {
      assert(book && this.hadithsBooks.includes(book), `Book name must be one of ${this.hadithsBooks.join(', ')}`);

      const API_ENDPOINT_CHAPTERS = `${this.baseUrl}/${book}/chapters?apiKey=${this.apiKey}`;
      try {
         const response = await fetch(`${API_ENDPOINT_CHAPTERS}`, {
            method: 'GET',
            headers: {
               'Content-Type': 'application/json',
            },
         });
         const data = await response.json();
         logger.info('Hadith chapters retrieved successfully from API');
         return data.chapters;
      } catch (error) {
         logger.error('Error during retrieve hadith chapters', error);
         throw error;
      }
   }

   /**
    * Get a hadith from the API
    * @param {string} book 
    * @param {int} chapterNumber 
    * @param {int} hadithNumber 
    * @returns {Promise<Object>} A hadith object
    */
   async getHadith(book, chapterNumber, hadithNumber) {
      const hadithsBooks = (await this.getBooks()).map(book => book.bookSlug)
      assert(book && hadithsBooks.includes(book), `Book name must be one of ${hadithsBooks.join(', ')}`);
      assert(chapterNumber && Number.isInteger(chapterNumber), 'chapterNumber name must be an integer');
      assert(hadithNumber && Number.isInteger(hadithNumber), 'hadithNumber must be an integer');

      const API_ENDPOINT_HADITH = `${this.baseUrl}/hadiths?book=${book}&chapterNumber=${chapterNumber}&hadithNumber=${hadithNumber}&apiKey=${this.apiKey}`;
      try {
         const response = await fetch(`${API_ENDPOINT_HADITH}`, {
            method: 'GET',
            headers: {
               'Content-Type': 'application/json',
            },
         });
         const data = await response.json();

         if (!data.hadiths || data.hadiths.total === 0) {
            return null; // No hadith found
         }
         return data.hadiths.data[0]; // Return the hadith found (should be only one)
      } catch (error) {
         throw error;
      }
   }

   /**
    * Get a random hadith from the API
    * @return {Promise<Object>} A random hadith object
    * @throws {Error} If an error occurs while fetching the hadith
    */
   async getRandomHadith(retries = 9) {
      const hadithBook = this.hadithsBooks[getRandomInt(this.hadithsBooks.length)];
      const book = await this.getBooks().then(books => books.find(b => b.bookSlug === hadithBook));

      while (retries > 0) {
         try {
            const chapterNumber = getRandomInt(book.chapters_count) + 1; // +1 because chapter numbers start from 1
            const hadithNumber = getRandomInt(book.hadiths_count) + 1; // +1 because hadith numbers start from 1

            const hadith = await this.getHadith(hadithBook, chapterNumber, hadithNumber);
            if (hadith) {
               return hadith; // Return the hadith found
            }
            logger.warn(`No hadith found for book ${hadithBook}, chapter ${chapterNumber}, hadith ${hadithNumber}. Retrying...`);
            retries--;
         } catch (error) {
            logger.error('Error during retrieve random hadith', error);
            retries--;
            if (retries === 0) {
               throw new Error('Failed to retrieve a random hadith after multiple attempts');
            }
         }
      }
      return hadith;
   }
}