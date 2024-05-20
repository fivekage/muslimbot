/**
 * Get a random integer between 0 and max
 * @param {number} max
 * @return {number} a random integer
 */
module.exports.getRandomInt = (max) => {
   return Math.floor(Math.random() * max);
}
