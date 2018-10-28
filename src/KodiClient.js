import KodiRequest from './KodiRequest.js';

function KodiClient(handler, notifier) {
    if (!(this instanceof KodiClient)) {
        return new KodiClient(handler, notifier);
    }

    let listeners = [];

    // default factory
    let factory = (() => {
        let requestId = 1;
        return options => new KodiRequest(requestId++, options)
    })();

    KodiClient.prototype.factory = newFactory =>  {
        factory = newFactory;

        return this;
    };

    notifier((notification, messageEvent) => {
        listeners.forEach(callback => callback(notification, messageEvent));
    });

    KodiClient.prototype.send = (request, options) => handler.call(handler, request, options);

    KodiClient.prototype.request = (method, params, options) => this.send(factory.call(factory, {method, params}), options);

    KodiClient.prototype.addNotificationListener = function(listener) {
        const index = listeners.push(listener);

        return () => {
            delete listeners[index];
        };
    };

    KodiClient.prototype.removeNotificationListener = function(listener) {
        listeners = listeners.filter(currentListener => currentListener === listener);
    };
}

export default KodiClient;