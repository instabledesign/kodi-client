import Request from './request.js'
import Response from './response.js'
import {TransportAjax, TransportWebsocket} from './transports.js'
import {Exception} from './exceptions.js'

export default class KodiClient {
    constructor(options) {
        var that = this;
        this.callId = 1;
        this.calls = [];
        this.options = {
            websocket: {},
            ajax: {}
        };

        Object.assign(this.options, options);

        if (TransportWebsocket.isSupported) {
            this.transport = new TransportWebsocket(this.options.websocket);
        }
        else if (TransportAjax.isSupported) {
            this.transport = new TransportAjax(this.options.ajax);
        }
        else {
            throw new Exception('No transport is supported.');
        }

        this.transport.on('message', function(data) {
            var response = new Response(data);
            if (that.calls[response.id]) {
                that.calls[response.id].resolve(response);
            }
        });

        this.transport.on('request', function(sendData) {
            that.calls[sendData.request.id] = sendData;
        });
    }

    call (methodName, parameters, id) {
        return this.transport.send(new Request(methodName, parameters, id || this.callId++));
    };
}
