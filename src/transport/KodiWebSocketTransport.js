import KodiNotification from '../KodiNotification.js';
import KodiResponse from '../KodiResponse.js';

function KodiWebSocketTransport(uri) {
    if (!(this instanceof KodiWebSocketTransport)) {
        return new KodiWebSocketTransport(uri);
    }

    let deferreds = {};
    // let notifiables = [];
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

                // const notification = new KodiNotification(messageData);
                // notifiables.forEach(callback => callback(notification, messageEvent));
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

    // KodiWebSocketTransport.prototype.addNotifiable = function(notifiable) {
    //     const index = this.notifiables.push(notifiable);
    //
    //     return () => {
    //         delete this.notifiables[index];
    //     };
    // };
}

export default KodiWebSocketTransport;