export default cache => handler => (request, options) => {
    const cacheOptions = Object.assign({
        cache: true,
        checkCache: true,
        writeCache: true
    }, options);

    const key = JSON.stringify([request.method, request.params]);
    return new Promise((resolve, reject) => {
        if (cacheOptions.cache && cacheOptions.checkCache) {
            const item = cache.get(key);
            if (item) {
                console.log('Cache hit %s', key, item);
                resolve(item);

                return;
            }

            console.log('Cache miss %s', key);
        }

        handler(request, options)
            .then(data => {
                if (cacheOptions.cache && cacheOptions.writeCache) {
                    console.debug('Cache write %s', key, data);
                    cache.set(key, data);
                }
                resolve(data);
            })
            .catch(error => reject(error));
    });
};

