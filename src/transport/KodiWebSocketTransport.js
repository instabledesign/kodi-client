import KodiNotification from '../KodiNotification.js';
import KodiResponse from '../KodiResponse.js';

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

export default KodiWebSocketTransport;
