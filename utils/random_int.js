/**
 * Get a random integer between 0 and max
 * @param {int} max
 * @return {int} a random integer
 */
module.exports.getRandomInt = (max) => {
   return parseInt(Math.floor(Math.random() * parseInt(max)));
}
