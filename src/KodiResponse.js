function KodiResponse(data) {
    if (!(this instanceof KodiResponse)) {
        return new KodiResponse(data);
    }

    if (data && 'object' !== Object.prototype.toString.call(data).split(" ").pop().split("]").shift().toLowerCase()) {
        throw new TypeError('Data must be an object.');
    }

    Object.assign(this, data);
}

export default KodiResponse;