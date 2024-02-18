module.exports.retrievePrayersOfTheDay = async (city, country, iso8601 = true) => {
    return new Promise((resolve, reject) => {
        const API_ENDPOINT_PRAYERS = `http://api.aladhan.com/v1/timingsByAddress?address=${city},${country}&iso8601=${iso8601 ? 'true' : 'false'}`
        fetch(API_ENDPOINT_PRAYERS)
            .then(async response => {
                if (!response.ok || response.status !== 200) {
                    return reject("Location not found")
                }

                const response_json = await response.json()
                return response_json;
            })
            .then(response => {
                resolve(response['data']['timings'])
            })
            .catch(error => {
                reject(error)
            })
    })
}