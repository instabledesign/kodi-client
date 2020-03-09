import TransportError from 'KodiTransportError.js';

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

var KodiRequestFactory = (function () {
    let requestId = 1;
    return options => new KodiRequest(requestId++, options)
})();

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

function KodiClientRPC(kodiClient) {
    if (!(this instanceof KodiClientRPC)) {
        return new KodiClientRPC(kodiClient);
    }

    if (!(kodiClient instanceof KodiClient)) {
        throw new TypeError('It must be a KodiClient.');
    }

    let schema = null;
    let listeners = {};

    this.getClient = () => kodiClient;
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
    let onReady;

    KodiWebSocketTransport.prototype.connect = () => {
        if (onReady) {
            return onReady
        }
        onReady = new Promise((resolve, reject) => {
            websocket = new WebSocket(uri);

            websocket.onopen = () => resolve(websocket);

            websocket.onerror = event => {
                if (websocket.readyState == 1) {
                    console.error(event);
                }
            };

            websocket.onmessage = event => {
                const messageData = JSON.parse(event.data);
                if (null === messageData.id) {
                    console.error(event);

                    return;
                }
                if (messageData.id) {
                    const response = new Kodi.Response(messageData);
                    response.error ?
                        deferreds[response.id].deferredReject(response) :
                        deferreds[response.id].deferredResolve(response);

                    return;
                }

                const notification = new KodiNotification(messageData);
                listeners.forEach(callback => callback(notification, event));
            };

            websocket.onclose = event => {
                websocket = null;
                if (event.code != 3001) {
                    reject(event);
                }
            };
        });

        return onReady;
    };

    KodiWebSocketTransport.prototype.send = (request, options) => {
        if (!request.id) {
            throw new TypeError('Request id is require.');
        }
        let transport = this;
        return new Promise(function (resolve, reject) {
            deferreds[request.id] = {promise: this, deferredResolve: resolve, deferredReject: reject};

            try {
                transport.connect().then(() => websocket.send(request.toJson()));
            } catch (error) {
                reject(new KodiResponse({message: 'An error occured during sending message.', error: error}));
            }
        });
    };

    KodiWebSocketTransport.prototype.addNotificationListener = listener => {
        const index = listeners.push(listener);

        return () => {
            delete listeners[index];
        };
    };

    KodiWebSocketTransport.prototype.removeNotificationListener = listener => {
        listeners = listeners.filter(currentListener => currentListener === listener);
    };

    KodiWebSocketTransport.prototype.disconnect = () => {
        if (websocket) {
            websocket.close(3001);
        }
    };
}

function KodiXMLHttpTransport(uri) {
    if (!(this instanceof KodiXMLHttpTransport)) {
        return new KodiXMLHttpTransport(uri);
    }

    KodiXMLHttpTransport.prototype.connect = async () => this;

    KodiXMLHttpTransport.prototype.send = function (request, options) {
        return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.onreadystatechange = function (event) {
                if (this.readyState === XMLHttpRequest.DONE) {
                    if (this.status === 200) {
                        const response = new KodiResponse(JSON.parse(this.responseText));
                        response.error ? reject(response) : resolve(response);
                    } else {
                        let e = new TransportError('XHR Error' + this.statusText, event);
                        reject(new KodiResponse({message: e.message, error: e}));
                    }
                }
            };
            req.onerror = function (event) {
                let e = new TransportError('XHR Error' + this.statusText, event);
                reject(new KodiResponse({message: e.message, error: e}));
            };
            req.open('GET', uri + '?request=' + request.toJson(), true);
            req.send(null);
        });
    };

    KodiXMLHttpTransport.prototype.addNotificationListener = function (listener) {
        console.warn('Notification for KodiXMLHttpTransport is not implemented yet');
    };

    KodiXMLHttpTransport.prototype.close = function () {
    };
}

var LoggingNotificationMiddleware = handler => (notification, messageEvent) => {
    console.log('Notification %o.', notification, messageEvent);

    handler(notification, messageEvent);
};

var stackNotification = (notifier, middlewares) => handler => {
    if (!middlewares) {
        return notifier(handler);
    }
    return notifier(
        middlewares.reverse().reduce(
            (prev, cur) => null === prev ? cur : cur(prev),
            handler
        )
    );
};

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

var stack = (handler, middlewares) => {
    if (!middlewares) {
        return handler;
    }
    return middlewares.reverse().reduce(
        (prev, cur) => null === prev ? cur : cur(prev),
        handler
    );
};

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

const defaultWebsocketURI = 'ws://{host}:9090';
const defaultHttpURI = `http://{host}:8080/jsonrpc`;

function getTransport(options) {
    let transport = options.transport;

    if (!transport) {
        transport = typeof window.WebSocket === 'function' ? defaultWebsocketURI : defaultHttpURI;
        transport = transport.replace('{host}', window.location);
    }
    switch (typeof transport) {
        case 'object':
            if (
                typeof transport.send !== 'function' ||
                typeof transport.addNotificationListener !== 'function'
            ) {
                throw TypeError('Kodi transport object must implement send(request, options), addNotificationListener(listener) function')
            }
            return transport;
        case 'string':
            let url = '';
            try {
                url = new URL(transport);
            } catch (e) {
                throw TypeError('Kodi transport string must be a valid path');
            }
            if (null !== url.protocol.match(/wss?:/)) {
                return new KodiWebSocketTransport(url.toString());
            }
            return new KodiXMLHttpTransport(url.toString());
        default:
            throw TypeError('Kodi transport can be object or url');
    }
}

function getCache(options) {
    let cache = options.cache;
    if (typeof cache == 'object') {
        if (
            typeof cache.set !== 'function' ||
            typeof cache.get !== 'function' ||
            typeof cache.delete !== 'function' ||
            typeof cache.clear !== 'function'
        ) {
            throw TypeError('Kodi cache must implement set(key, value), get(key), delete(key), clear() function')
        }
        return cache
    }

    return window.localStorage ? new LocalStorage('request_') : new InMemory();
}

function getMiddlewares(options) {
    let middlewares = options.middlewares || [LoggingMiddleware];

    if (options.cache !== false) {
        middlewares.push(
            CacheMiddleware(withTTL(getCache(options), options.cacheTTL || 10000))
        );
    }

    return middlewares;
}

function getNotificationMiddlewares(options) {
    return options.notificationMiddlewares || [LoggingNotificationMiddleware];
}

function createClientRPC(options) {
    return new KodiClientRPC(createClient(options));
}

function createClient(options) {
    const transport = getTransport(options);
    return new KodiClient({
        connect: transport.connect,
        disconnect: transport.disconnect,
        send: stack(transport.send, getMiddlewares(options)),
        addNotificationListener: stackNotification(transport.addNotificationListener, getNotificationMiddlewares(options))
    });
}

export { KodiClient as Client, KodiClientRPC as ClientRPC, InMemory, LocalStorage, KodiRequest as Request, KodiRequestFactory as RequestFactory, KodiResponse as Response, KodiWebSocketTransport as WebSocketTransport, KodiXMLHttpTransport as XMLHttpTransport, createClient, createClientRPC, LoggingNotificationMiddleware as notificationMiddlewareLogging, stackNotification as notificationStackMiddleware, CacheMiddleware as requestMiddlewareCache, LoggingMiddleware as requestMiddlewareLogging, stack as requestReuestMiddleware, withTTL };
