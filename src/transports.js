var TransportAjax = function (options) {
    this._parent.call(this, ['request', 'message', 'error']);
    var that = this;

    if (window.XMLHttpRequest) {
        this.xhr_object = new XMLHttpRequest();
    }
    else if (window.ActiveXObject) {
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

    that.onready = new Promise(function (resolve, reject) {
        try {
            that.xhr_object.open.apply(
                that.xhr_object,
                ObjectToArray(that.options.open)
            );
            resolve();
        }
        catch (e) {
            reject(e);
        }
    });
};

TransportAjax.prototype = {
    send: function (data) {
        var that = this;

        return new Promise(function (resolve, reject) {
            that.xhr_object.onreadystatechange = function () {
                if (that.xhr_object.readyState == 4) {
                    if (that.xhr_object.status !== 200) {
                        reject(that.xhr_object.statusText);
                        that.fire('error', that.xhr_object.statusText);
                    }
                    else {
                        that.fire('message', that.xhr_object);
                    }
                }
            };

            for (var name in that.options.headers) {
                that.xhr_object.setRequestHeader(name, that.options.headers[name]);
            }

            that.fire('request', {request: data, resolve: resolve, reject: reject});
            that.xhr_object.send(data);
        });
    },
    getResponseData: function (xhr_object) {
        return xhr_object.responseText;
    }
};

extend(TransportAjax, Listenable);

var TransportWebsocket = function (options) {
    this._parent.call(this, ['request', 'message', 'error']);
    var that = this;
    if (!typeof window.WebSocket === 'function') {
        throw new Exception('Browser not support WebSocket.');
    }
    if ((typeof options.url) !== 'string') {
        throw new InvalidArgumentException(options.url, 'string');
    }
    if (options.onmessage && (typeof options.onmessage) !== 'function') {
        throw new InvalidArgumentException(options.onmessage, 'function');
    }
    if (options.onerror && (typeof options.onerror) !== 'function') {
        throw new InvalidArgumentException(options.onerror, 'function');
    }
    if (options.onclose && (typeof options.onclose) !== 'function') {
        throw new InvalidArgumentException(options.onclose, 'function');
    }

    var CONNECTING = 0;
    var OPEN = 1;
    var CLOSING = 2;
    var CLOSED = 3;

    this.options = {
        url: options.url,
        onmessage: function () {
        },
        onerror: function () {
        },
        onclose: function () {
        }
    };
    merge(this.options, options);

    that.websocket = new WebSocket(that.options.url);

    that.onready = new Promise(function (resolve, reject) {
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
    send: function (data) {
        var that = this;

        return new Promise(function (resolve, reject) {
            that.onready.then(function () {
                that.fire('request', {request: data, resolve: resolve, reject: reject});
                that.websocket.send(data);
            });
        });
    },
    getData: function (event) {
        return event.data;
    }
};

extend(TransportWebsocket, Listenable);
