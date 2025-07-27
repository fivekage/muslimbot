const sleep = (ms) => new Promise(resolve => setTimeout(resolve, Math.max(0, ms)));

const waitFor = async (condition, pollInterval = 200, timeoutAfter = 10 * 60 * 1000) => {
   const start = Date.now();

   while (true) {
      if (Date.now() - start > timeoutAfter) {
         throw new Error('Condition not met before timeout');
      }

      const result = await condition();
      if (result) return result;

      await sleep(pollInterval);
   }
};

module.exports = {
   waitFor,
   sleep,
};
