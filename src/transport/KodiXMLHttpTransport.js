import KodiResponse from '../KodiResponse.js';

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


export default KodiXMLHttpTransport;