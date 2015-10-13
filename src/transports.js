import {Exception, InvalidArgumentException} from './exceptions.js'

class Transport {
    constructor () {
        this.listeners = {
            request: [],
            message: [],
            error: []
        }
        if (!this.onready) {
            throw 'You must redefined "onready" handler in inherited class.';
        }
    }

    send (request) {
        throw 'You must redefine this method in inherited class.';
    }

    hasListener(eventName) {
        return this.listeners.hasOwnProperty(eventName);
    }

    on (eventName, callback) {
        if (!this.hasListener(eventName)) {
            throw new Exception('Event "' + eventName + '" does\'nt exist.');
        }
        else if (typeof callback !== 'function') {
            throw new InvalidArgumentException(callback, 'function');
        }

        this.listeners[eventName].push(callback);
    }

    fire (eventName, value) {
        if (!this.hasListener(eventName)) {
            throw new Exception('Event "' + eventName + '" does\'nt exist.');
        }
        else {
            for (var i in this.listeners[eventName]) {
                this.listeners[eventName][i](value);
            }
        }
    }
}

class TransportAjax extends Transport {
    constructor(options) {
        var that = this;
        this.xhr_object = null;

        if (!TransportAjax.isSupported()) {
            throw new Exception('Browser not support XMLHTTPRequest.');
        }

        if(window.XMLHttpRequest) {
            this.xhr_object = new XMLHttpRequest();
        }
        else if(window.ActiveXObject) {
            this.xhr_object = new ActiveXObject('Microsoft.XMLHTTP');
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
        Object.assign(this.options, options);

        var openOptions = Object.keys(this.options.open).map( function (k) {return that.options.open[k];} );

        that.onready = new Promise(function(resolve, reject){
            try {
                that.xhr_object.open.apply(that.xhr_object, openOptions);
                resolve();
            }
            catch (e) {
                reject(e);
            }
        });

        super(this.options);
    }

    static isSupported () {
        return window.XMLHttpRequest || !window.ActiveXObject;
    }

    send (data) {
        var that = this;

        return new Promise(function(resolve, reject){
            that.xhr_object.onreadystatechange = function() {
                if(that.xhr_object.readyState == 4) {
                    if (that.xhr_object.status !== 200) {
                        reject(that.xhr_object.statusText);
                        that.fire('error', that.xhr_object.statusText);
                    }
                    else {
                        that.fire('message', that.xhr_object.responseText);
                    }
                }
            };

            for(var name in that.options.headers) {
                that.xhr_object.setRequestHeader(name, that.options.headers[name]);
            }

            that.fire('request', {request: data, resolve: resolve, reject: reject});
            that.xhr_object.send(data);
        });
    }
}

class TransportWebsocket extends Transport {
    constructor(options) {
        var that = this;
        if (!TransportWebsocket.isSupported()) throw new Exception('Browser not support WebSocket.');
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
        Object.assign(this.options, options);

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
            that.fire('message', event.data);
        };

        that.websocket.onerror = function (event) {
            that.fire('error', event);
        };

        super(this.options);
    }

    static isSupported () {
        return typeof window.WebSocket === 'function';
    }

    send(data) {
        var that = this;
        return new Promise(function(resolve, reject){
            that.onready.then(function () {
                that.fire('request', {request: data, resolve: resolve, reject: reject});
                that.websocket.send(data);
            });
        });
    }
}

export {Transport, TransportAjax, TransportWebsocket}