(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof exports === 'object') {
        // CommonJS
        module.exports = factory();
    } else {
        // Browser globals
        root.KodiClient = factory();
    }
}(this, function () {
    var JSONRPC_VERSION = "2.0";
    var RESPONSE_ERROR_SERVER_ERROR       = -32000;
    var RESPONSE_ERROR_PARSING            = -32700;
    var RESPONSE_ERROR_INVALID_REQUEST    = -32600;
    var RESPONSE_ERROR_METHOD_NOT_FOUND   = -32601;
    var RESPONSE_ERROR_INVALID_PARAMETERS = -32602;
    var RESPONSE_ERROR_INTERNAL_ERROR     = -32603;

    var merge = function (target, object) {
        for (var key in object) {
            if (target.hasOwnProperty(key) && typeof target[key] == 'object' && typeof object[key] == 'object') {
                merge(target[key], object[key]);
            }
            else {
                target[key] = object[key];
            }
        }
    };

    var extend = function (child, parent) {
        var childPrototype = child.prototype;
        child.prototype = Object.create(parent.prototype);
        for (var key in childPrototype) {
            if (child.prototype[key]) {
                child.prototype['_' + key] = child.prototype[key];
            }
            child.prototype[key] = childPrototype[key];
        }
        Object.defineProperty(child.prototype, 'constructor', {
            enumerable: false,
            value:      child
        });
        Object.defineProperty(child.prototype, '_parent', {
            enumerable: false,
            value:      parent
        });
    };

    var ObjectToArray = function (object) {
        return Object.keys(object).map(function (key) {
            return object[key];
        })
    };

    var Exception = function(message, code) {
        this.message = message || '';
        this.code = code;
    };

    Exception.prototype.toString = function() {
        return this.message;
    };

    var InvalidJsonRpc = function(message, code) {
        this.message = message;
        this.code = code;
    };
    extend(InvalidJsonRpc, Exception);

    var InvalidArgumentException = function(object, type, message) {
        this._parent.call(this, 'Need to be an "' + type + '". "' + typeof(object) + '" given.' + (message || ''));
    };
    extend(InvalidArgumentException, Exception);

    var Request = function(methodName, parameters, id) {
        this.jsonrpc = JSONRPC_VERSION;
        this.id = id || 0;
        this.method = methodName;
        this.params = parameters || {};
    };

    Request.prototype.toString = function() {
        return JSON.stringify(this);
    };

    var Response = function(rawResponse) {
        if (rawResponse == undefined || rawResponse == '') {
            throw new Exception('The JSON-RPC is empty.');
        }

        try {
            Object.assign(this, JSON.parse(rawResponse))
        }
        catch (e){
            throw new InvalidJsonRpc('The JSON-RPC response is not valid.', RESPONSE_ERROR_PARSING);
        }

        if (this.hasOwnProperty('jsonrpc') && (this.jsonrpc == '' || this.jsonrpc < JSONRPC_VERSION)) {
            throw new InvalidJsonRpc('The JSON-RPC response version is not supported.');
        }

        if (!this.hasOwnProperty('result') && !this.hasOwnProperty('error')) {
            throw new Exception('The JSON-RPC response must have a result or error property.');
        }
    };

    Response.prototype = {
        toString: function() {
            return JSON.stringify(this);
        },
        isError: function() {
            return this.hasOwnProperty('error')
        },
        getError: function() {
            if (this.isError()) {
                return {};
            }

            return false;
        },
        getResult: function() {
            return this.result;
        }
    };


    var Listenable = function(listeners) {
        this.listeners = {};
        for (var i in listeners) {
            this.listeners[listeners[i]] = [];
        }
    };

    Listenable.prototype = {
        hasListener: function(eventName) {
            return this.listeners.hasOwnProperty(eventName);
        },
        on: function(eventName, callback) {
            if (!this.hasListener(eventName)) {
                throw new Exception('Event "' + eventName + '" does\'nt exist.');
            }
            else if (typeof callback !== 'function') {
                throw new InvalidArgumentException(callback, 'function');
            }

            this.listeners[eventName].push(callback);
        },
        fire: function(eventName, value) {
            if (!this.hasListener(eventName)) {
                throw new Exception('Event "' + eventName + '" does\'nt exist.');
            }
            else {
                for (var i in this.listeners[eventName]) {
                    this.listeners[eventName][i](value);
                }
            }
        }
    };

    var TransportAjax = function(options) {
        this._parent.call(this, ['request', 'message', 'error']);
        var that = this;

        if(window.XMLHttpRequest) {
            this.xhr_object = new XMLHttpRequest();
        }
        else if(window.ActiveXObject) {
            this.xhr_object = new ActiveXObject('Microsoft.XMLHTTP');
        }

        if (this.xhr_object === undefined) {
            throw new Exception('Browser not support XMLHTTPRequest.');
        }

        this.options = {
            open: {
                method: null,
                url: '',
                async: true,
                username: null,
                password: null
            },
            headers: {
                'Content-type': 'application/json'
            }
        };
        merge(this.options, options);

        that.onready = new Promise(function(resolve, reject){
            try {
                that.xhr_object.open.apply(
                    that.xhr_object,
                    Object.keys(that.options.open).map( function (k) {return that.options.open[k];})
                );
                resolve();
            }
            catch (e) {
                reject(e);
            }
        });
    };

    TransportAjax.prototype = {
        send: function(data) {
            var that = this;

            return new Promise(function(resolve, reject){
                that.xhr_object.onreadystatechange = function() {
                    if(that.xhr_object.readyState == 4) {
                        if (that.xhr_object.status !== 200) {
                            reject(that.xhr_object.statusText);
                            that.fire('error', that.xhr_object.statusText);
                        }
                        else {
                            that.fire('message', that.xhr_object);
                        }
                    }
                };

                for(var name in that.options.headers) {
                    that.xhr_object.setRequestHeader(name, that.options.headers[name]);
                }

                that.fire('request', {request: data, resolve: resolve, reject: reject});
                that.xhr_object.send(data);
            });
        },
        getResponseData: function(xhr_object) {
            return xhr_object.responseText;
        }
    };

    extend(TransportAjax, Listenable);

    var TransportWebsocket = function(options) {
        this._parent.call(this, ['request', 'message', 'error']);
        var that = this;
        if (!typeof window.WebSocket === 'function') throw new Exception('Browser not support WebSocket.');
        if ((typeof options.url) !== 'string') throw new InvalidArgumentException(options.url, 'string');
        if (options.onmessage && (typeof options.onmessage) !== 'function') throw new InvalidArgumentException(options.onmessage, 'function');
        if (options.onerror && (typeof options.onerror) !== 'function') throw new InvalidArgumentException(options.onerror, 'function');
        if (options.onclose && (typeof options.onclose) !== 'function') throw new InvalidArgumentException(options.onclose, 'function');

        var CONNECTING = 0;
        var OPEN = 1;
        var CLOSING = 2;
        var CLOSED = 3;

        this.options = {
            url:       options.url,
            onmessage: function () {},
            onerror:   function () {},
            onclose:   function () {}
        };
        merge(this.options, options);

        that.websocket = new WebSocket(that.options.url);

        that.onready = new Promise(function(resolve, reject){
            that.websocket.onopen = function (event) {
                if (that.websocket.readyState == OPEN) {
                    resolve(event);
                }
                else {
                    that.fire('error', event);
                    reject(event);
                }
            };
        });

        that.websocket.onmessage = function (event) {
            that.fire('message', event);
        };

        that.websocket.onerror = function (event) {
            that.fire('error', event);
        };
    };

    TransportWebsocket.prototype = {
        send: function(data) {
            var that = this;

            return new Promise(function(resolve, reject){
                that.onready.then(function () {
                    that.fire('request', {request: data, resolve: resolve, reject: reject});
                    that.websocket.send(data);
                });
            });
        },
        getData: function(event) {
            return event.data;
        }
    };

    extend(TransportWebsocket, Listenable);

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

        this.transport.on('message', function(event) {
            that.handleResponseEvent(event);
        });

        this.transport.on('request', function(event) {
            that.handleRequestEvent(event);
        });
    };

    KodiClient.prototype = {
        request: function (methodName, parameters, id) {
            return this.transport.send(this.createRequest(methodName, parameters, id));
        },
        createRequest: function (methodName, parameters, id) {
            return new Request(methodName, parameters, id || this.callId++);
        },
        createResponse: function (data) {
            return new Response(data);
        },
        handleResponseEvent: function(responseEvent) {
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
        handleRequestEvent: function(requestEvent) {
            this.calls[requestEvent.request.id] = requestEvent;
        }
    };

    return KodiClient;
}));
