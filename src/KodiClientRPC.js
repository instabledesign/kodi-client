import KodiClient from './KodiClient.js';

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
        kodiClient.request('JSONRPC.Introspect', {
            "getdescriptions": true,
            "getmetadata": true,
            "filterbytransport": true
        }).then(data => {
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
    KodiClientRPC.prototype.createRequest = kodiClient.createRequest;
    KodiClientRPC.prototype.connect = () => {
        return kodiClient.connect();
    };
    KodiClientRPC.prototype.disconnect = kodiClient.disconnect;
    KodiClientRPC.prototype.request = kodiClient.request;
    KodiClientRPC.prototype.send = kodiClient.send;
    KodiClientRPC.prototype.addNotificationListener = kodiClient.addNotificationListener;
    KodiClientRPC.prototype.removeNotificationListener = kodiClient.removeNotificationListener;
}

export default KodiClientRPC;
