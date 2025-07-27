module.exports.sleep = (ms) => {
   return new Promise((resolve) => setTimeout(resolve, Math.max(ms, 0)));
}