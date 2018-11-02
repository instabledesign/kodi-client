function InMemory(restoreData) {
    if (!(this instanceof InMemory)) {
        return new InMemory(restoreData);
    }

    let data = restoreData || {};

    InMemory.prototype.set = (key, value) => data[key] = value;

    InMemory.prototype.get = key => data[key];

    InMemory.prototype.delete = key => delete data[key];

    InMemory.prototype.clear = () => data = {};
}

export default InMemory;