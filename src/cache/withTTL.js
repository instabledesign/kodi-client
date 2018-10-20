function withTTL(cache, TTL) {
    return {
        set: (key, value) => cache.set(key, {time: Date.now(), value: value}),
        get: key => {
            const item = cache.get(key);
            if (item && item.time) {
                if (item.time > Date.now() - TTL) {
                    return item.value;
                }

                console.log('Cache expire.');

                return null;
            }

            return item;
        },
        delete: key => cache.delete(key),
        clear: () => cache.clear(),
    };
}

export default withTTL;