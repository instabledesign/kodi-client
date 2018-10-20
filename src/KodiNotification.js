function KodiNotification(data) {
    if (!(this instanceof KodiNotification)) {
        return new KodiNotification(data);
    }

    Object.assign(this, data);
}

export default KodiNotification;