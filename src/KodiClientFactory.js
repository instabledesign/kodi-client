import KodiClient from './KodiClient.js';
import KodiClientRPC from './KodiClientRPC.js';

import KodiWebSocketTransport from './transport/KodiWebSocketTransport.js';
import KodiXMLHttpTransport from './transport/KodiXMLHttpTransport.js';

import LoggingNotificationMiddleware from './middleware/notifier/logging.js';
import stackNotification from './middleware/notifier/stackFactory.js';

import LoggingMiddleware from './middleware/query/logging.js';
import CacheMiddleware from './middleware/query/cache.js';
import stack from './middleware/query/stackFactory.js';

import InMemory from './cache/InMemory.js';
import LocalStorage from './cache/LocalStorage.js';
import withTTL from './cache/withTTL.js';

const defaultWebsocketURI = 'ws://{host}:9090';
const defaultHttpURI = `http://{host}:8080/jsonrpc`;

function getTransport(options) {
    let transport = options.transport;

    if (!transport) {
        transport = typeof window.WebSocket === 'function' ? defaultWebsocketURI : defaultHttpURI;
        transport = transport.replace('{host}', window.location)
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
        )
    }

    return middlewares;
}

function getNotificationMiddlewares(options) {
    return options.notificationMiddlewares || [LoggingNotificationMiddleware];
}

export function createClientRPC(options) {
    return new KodiClientRPC(createClient(options));
}

export function createClient(options) {
    const transport = getTransport(options);
    return new KodiClient({
        connect: transport.connect,
        disconnect: transport.disconnect,
        send: stack(transport.send, getMiddlewares(options)),
        addNotificationListener: stackNotification(transport.addNotificationListener, getNotificationMiddlewares(options))
    });
}
