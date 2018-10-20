import KodiRequest from './KodiRequest.js';

function KodiClient(handler) {
    if (!(this instanceof KodiClient)) {
        return new KodiClient(handler);
    }

    // default factory
    let factory = (() => {
        let requestId = 1;
        return options => new KodiRequest(requestId++, options)
    })();

    KodiClient.prototype.factory = newFactory =>  {
        factory = newFactory;

        return this;
    };

    KodiClient.prototype.send = (request, options) => handler.call(handler, request, options);

    KodiClient.prototype.request = (method, params, options) => this.send(factory.call(factory, {method, params}), options);
}

export default KodiClient;