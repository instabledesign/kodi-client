import KodiRequestFactory from './KodiRequestFactory.js';

function KodiClient(transport, options) {
    if (!(this instanceof KodiClient)) {
        return new KodiClient(transport);
    }

    options = options || {};
    let listeners = [];

    const factory = options.factory || KodiRequestFactory;

    // transport.addNotificationListener((notification, messageEvent) => {
    //     listeners.forEach(callback => callback(notification, messageEvent));
    // });

    /**
     * request(method, params)
     * request({object})
     */
    KodiClient.prototype.createRequest = function () {
        if (typeof arguments[0] == 'object') {
            return Object.assign(factory.call(factory, {}), arguments[0]);
        }
        return factory.call(factory, {method: arguments[0], params: arguments[1]});
    };

    KodiClient.prototype.connect = transport.connect;

    KodiClient.prototype.disconnect = transport.disconnect;

    KodiClient.prototype.request = (method, params, options) => this.send(this.createRequest(method, params), options);

    KodiClient.prototype.send = (request, options) => transport.send(request, options);

    KodiClient.prototype.addNotificationListener = function (listener) {
        const index = listeners.push(listener);

        return () => {
            delete listeners[index];
        };
    };

    KodiClient.prototype.removeNotificationListener = function (listener) {
        listeners = listeners.filter(currentListener => currentListener === listener);
    };
}

export default KodiClient;
