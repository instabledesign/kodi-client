import KodiResponse from '../KodiResponse.js';
import TransportError from 'KodiTransportError.js';

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


export default KodiXMLHttpTransport;
