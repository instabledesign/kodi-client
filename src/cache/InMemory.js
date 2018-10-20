function InMemoryCache(restoreData) {
    if (!(this instanceof InMemoryCache)) {
        return new InMemoryCache(restoreData);
    }

    let data = restoreData || {};

    InMemoryCache.prototype.set = (key, value) => data[key] = value;

    InMemoryCache.prototype.get = key => data[key];

    InMemoryCache.prototype.delete = key => delete data[key];

    InMemoryCache.prototype.clear = () => data = {};
}

export default InMemoryCache;