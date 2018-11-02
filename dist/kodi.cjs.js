'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const JSONRPC_VERSION = '2.0';

function KodiRequest(id, options) {
    if (!(this instanceof KodiRequest)) {
        return new KodiRequest(id, options);
    }

    if (options && 'object' !== Object.prototype.toString.call(options).split(" ").pop().split("]").shift().toLowerCase()) {
        throw new TypeError('Options must be an object.');
    }

    this.id = id;

    ({
        method: this.method,
        params: this.params,
        jsonrpc: this.jsonrpc = JSONRPC_VERSION
    } = options || {});
}

KodiRequest.prototype.toJson = function() {
    return JSON.stringify({
        id: this.id,
        jsonrpc: this.jsonrpc,
        method: this.method,
        params: this.params
    });
};

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

function KodiClientRPC(kodiClient) {
    if (!(this instanceof KodiClientRPC)) {
        return new KodiClientRPC(kodiClient);
    }

    if (!(kodiClient instanceof KodiClient)) {
        throw new TypeError('It must be a KodiClient.');
    }

    let schema = null;
    let listeners = {};

    this.onReady = new Promise((resolve, reject) => {
        kodiClient.request('JSONRPC.Introspect', {"getdescriptions": true, "getmetadata": true, "filterbytransport": true}).then(data => {
            schema = data.result;

            const methods = schema.methods;
            for (const name in methods) {
                let [namespace, method] = name.split('.');
                if (!this[namespace]) {
                    this[namespace] = {};
                }
                this[namespace][method] = (params, options) => {
                    return kodiClient.request(name, params, options).then(response => response.result);
                };
            }

            const notifications = schema.notifications;

            for (const name in notifications) {
                let [namespace, notification] = name.split('.');
                if (!this[namespace]) {
                    this[namespace] = {};
                }
                this[namespace][notification] = callback => {
                    if (!listeners[`${namespace}.${notification}`]) listeners[`${namespace}.${notification}`] = [];
                    listeners[`${namespace}.${notification}`].push(callback);
                };
            }

            kodiClient.addNotificationListener((notification, messageEvent) => {
                if (listeners.hasOwnProperty(notification.method)) {
                    listeners[notification.method].forEach(callback => callback(notification.params, messageEvent));
                }
            });

            resolve([this, schema]);

        }).catch(reject);
    });
}

function KodiNotification(data) {
    if (!(this instanceof KodiNotification)) {
        return new KodiNotification(data);
    }

    Object.assign(this, data);
}

function KodiResponse(data) {
    if (!(this instanceof KodiResponse)) {
        return new KodiResponse(data);
    }

    if (data && 'object' !== Object.prototype.toString.call(data).split(" ").pop().split("]").shift().toLowerCase()) {
        throw new TypeError('Data must be an object.');
    }

    Object.assign(this, data);
}

function KodiWebSocketTransport(uri) {
    if (!(this instanceof KodiWebSocketTransport)) {
        return new KodiWebSocketTransport(uri);
    }

    let deferreds = {};
    let listeners = [];
    let websocket;
    let onReady = this.onReady = new Promise((resolve, reject) => {
        websocket = new WebSocket(uri);
        websocket.onerror = reject;
        websocket.onopen = function(event) {
            this.onmessage = messageEvent => {
                const messageData = JSON.parse(messageEvent.data);
                if (null === messageData.id) {
                    console.error(messageEvent);

                    return;
                }
                if (messageData.id) {
                    const response = new KodiResponse(messageData);
                    response.error ?
                        deferreds[response.id].deferredReject(response) :
                        deferreds[response.id].deferredResolve(response);

                    return;
                }

                const notification = new KodiNotification(messageData);
                listeners.forEach(callback => callback(notification, messageEvent));
            };
            resolve(event);
        };
    });

    KodiWebSocketTransport.prototype.send = function(request, options) {
        if (!request.id) {
            throw new TypeError('Request id is require.');
        }

        let deferredResolve;
        let deferredReject;
        const promise = new Promise(function(resolve, reject) {
            deferredResolve = resolve;
            deferredReject = reject;

            try {
                onReady.then(() => websocket.send(request.toJson()));
            } catch (error) {
                deferredReject(new KodiResponse({message: 'An error occured during sending message.', error: error}));
            }
        });

        deferreds[request.id] = { promise, deferredResolve, deferredReject };

        return promise;
    };

    KodiWebSocketTransport.prototype.addNotificationListener = function(listener) {
        const index = listeners.push(listener);

        return () => {
            delete listeners[index];
        };
    };

    KodiWebSocketTransport.prototype.removeNotificationListener = function(listener) {
        listeners = listeners.filter(currentListener => currentListener === listener);
    };
}

function KodiXMLHttpTransport(uri) {
    if (!(this instanceof KodiXMLHttpTransport)) {
        return new KodiXMLHttpTransport(uri);
    }

    KodiXMLHttpTransport.prototype.send = function (request, options) {
        return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.onreadystatechange = function(event) {
                if (this.readyState === XMLHttpRequest.DONE) {
                    if (this.status === 200) {
                        const response = new KodiResponse(JSON.parse(this.responseText));
                        response.error ? reject(response) : resolve(response);
                    } else {
                        reject(new KodiResponse({message: this.statusText, error: this}));
                    }
                }
            };

            req.open('GET', uri + '?request=' + request.toJson(), true);
            req.send(null);
        });
    };

    KodiXMLHttpTransport.prototype.addNotifiable = function (request, options) {};
}

var LoggingNotificationMiddleware = handler => (notification, messageEvent) => {
    console.log('Notification %o.', notification, messageEvent);

    handler(notification, messageEvent);
};

var stackNotification = (notifier, middlewares) => handler => notifier(
    middlewares.reverse().reduce(
        (prev, cur) => null === prev ? cur : cur(prev),
        handler
    )
);

var LoggingMiddleware = handler => (request, options) => {
    console.log('Request %o', request);
    const startTime = Date.now();

    return handler(request, options).then(data => {
        const end = Date.now();
        console.log('Response %o in %d ms', data, end - startTime);

        return data;
    });
};

var CacheMiddleware = cache => handler => (request, options) => {
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

var stack = (handler, middlewares) => middlewares.reverse().reduce(
    (prev, cur) => null === prev ? cur : cur(prev),
    handler
);

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

function LocalStorage(prefix) {
    if (!(this instanceof LocalStorage)) {
        return new LocalStorage(prefix);
    }
    prefix = prefix || '';

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

function getCache(options) {
    return options.cache || window.localStorage ? new LocalStorage('request_') : new InMemory();
}

function getTransport(options) {
    let uri = options.uri;
    if (!uri) {
        uri = window.location;
        uri = typeof window.WebSocket === 'function' ? `ws://${uri}:9090` : `http://${uri}:8080/jsonrpc`;
    }

    if (null !== (new URL(uri)).protocol.match(/wss?:/)) {
        return new KodiWebSocketTransport(uri);
    }

    return new KodiXMLHttpTransport(uri);
}

function getCacheMiddleware(options) {
    return options.cacheMiddleware || CacheMiddleware(withTTL(getCache(options), options.TTL || 10000));
}

function getMiddlewares(options) {
    return options.middlewares || [LoggingMiddleware, getCacheMiddleware(options)];
}

function getNotificationMiddlewares(options) {
    return options.notificationMiddlewares || [LoggingNotificationMiddleware];
}

function createClientRPC(options) {
    return new KodiClientRPC(createClient(options));
}

function createClient(options) {
    const transport = getTransport(options);

    return KodiClient(
        stack(transport.send, getMiddlewares(options)),
        stackNotification(transport.addNotificationListener, getNotificationMiddlewares(options))
    );
}

exports.createClient = createClient;
exports.createClientRPC = createClientRPC;
exports.ClientRPC = KodiClientRPC;
exports.Client = KodiClient;
exports.Request = KodiRequest;
exports.Response = KodiResponse;
exports.WebSocketTransport = KodiWebSocketTransport;
exports.XMLHttpTransport = KodiXMLHttpTransport;
exports.InMemory = InMemory;
exports.LocalStorage = LocalStorage;
exports.withTTL = withTTL;
exports.notificationMiddlewareLogging = LoggingNotificationMiddleware;
exports.notificationStackMiddleware = stackNotification;
exports.requestMiddlewareCache = CacheMiddleware;
exports.requestMiddlewareLogging = LoggingMiddleware;
exports.requestReuestMiddleware = stack;
