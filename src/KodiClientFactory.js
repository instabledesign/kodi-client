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

function getCache(options) {
    return options.cache || window.localStorage ? new LocalStorage('request_') : new InMemory();
}

function getTransport(options) {
    let uri = options.uri;
    if (!uri) {
        uri = window.location;
        uri = typeof window.WebSocket === 'function' ? `ws://${uri}:9090` : `http://${uri}:8080/jsonrpc`
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

export function createClientRPC(options) {
    return new KodiClientRPC(createClient(options));
}

export function createClient(options) {
    const transport = getTransport(options);

    return KodiClient(
        stack(transport.send, getMiddlewares(options)),
        stackNotification(transport.addNotificationListener, getNotificationMiddlewares(options))
    );
}
