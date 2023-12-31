const waitFor = async (condition, pollInterval = 200, timeoutAfter) => {
    // Track the start time for timeout purposes
    const startTime = Date.now();

    while (true) {
        // Check for timeout, bail if too much time passed
        if (typeof (timeoutAfter) === 'number' && Date.now() > startTime + timeoutAfter) {
            throw 'Condition not met before timeout';
        }

        // Check for conditon immediately
        const result = await condition();

        // If the condition is met...
        if (result) {
            // Return the result....
            return result;
        }

        // Otherwise wait and check after pollInterval
        await new Promise(r => setTimeout(r, pollInterval));
    }
}

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    waitFor,
    sleep
}