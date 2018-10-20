function LocalStorage(prefix) {
    if (!(this instanceof LocalStorage)) {
        return new LocalStorage(prefix);
    }
    prefix = prefix || '';
    let storage = localStorage;

    LocalStorage.prototype.set = (key, value) => localStorage.setItem(prefix+key, JSON.stringify(value));

    LocalStorage.prototype.get = key => {
        const item = localStorage.getItem(prefix+key);
        if (item){
            return JSON.parse(item);
        }

        return item;
    };

    LocalStorage.prototype.delete = key => localStorage.removeItem(prefix+key);

    LocalStorage.prototype.clear = () => localStorage.clear();
}

export default LocalStorage;