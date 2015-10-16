var KodiClient = function (options) {
    var that = this;
    this.callId = 1;
    this.calls = [];
    this.options = {
        websocket: {},
        ajax: {}
    };

    merge(this.options, options);

    if (Object.getOwnPropertyNames(this.options.websocket).length !== 0 && typeof window.WebSocket === 'function') {
        this.transport = new TransportWebsocket(this.options.websocket);
    }

    if (this.transport === undefined && Object.getOwnPropertyNames(this.options.ajax).length !== 0 && (window.XMLHttpRequest || window.ActiveXObject)) {
        this.transport = new TransportAjax(this.options.ajax);
    }

    if (this.transport === undefined) {
        throw new Exception('No transport is supported.');
    }

    this.transport.on('message', function (event) {
        that.handleMessageEvent(event);
    });

    this.transport.on('request', function (event) {
        that.handleRequestEvent(event);
    });

    that.onready = new Promise(function (resolve, reject) {
        that.transport.onready.then(function () {
            return that.send('JSONRPC.Introspect').then(function (response) {
                that.requestValidator = new RequestValidator(response.getResult());
                resolve();
            });
        })
        .catch(function(){
            reject();
        });

    });
};

KodiClient.prototype = {
    send: function (methodName, parameters, id) {
        var request = this.createRequest(methodName, parameters, id);

        try {
            if (this.requestValidator) {
                this.requestValidator.validate(request);
            }
        }
        catch (e) {
            return Promise.reject(e);
        }

        return this.transport.send(request);
    },
    createRequest: function (methodName, parameters, id) {
        return new Request(methodName, parameters, id || this.callId++);
    },
    createResponse: function (data) {
        return new Response(data);
    },
    handleMessageEvent: function (responseEvent) {
        var response = this.createResponse(this.transport.getData(responseEvent));
        if (this.calls[response.id]) {
            var call = this.calls[response.id];

            if (response.error) {
                call.reject(response);
            }
            else {
                call.resolve(response);
            }
        }
    },
    handleRequestEvent: function (requestEvent) {
        this.calls[requestEvent.request.id] = requestEvent;
    }
};
