var JSONRPC_VERSION = "2.0";
var REQUEST_INVALID_METHOD = 1000;
var REQUEST_INVALID_PARAMS = 1100;
var RESPONSE_ERROR_SERVER_ERROR = -32000;
var RESPONSE_ERROR_PARSING = -32700;
var RESPONSE_ERROR_INVALID_REQUEST = -32600;
var RESPONSE_ERROR_METHOD_NOT_FOUND = -32601;
var RESPONSE_ERROR_INVALID_PARAMETERS = -32602;
var RESPONSE_ERROR_INTERNAL_ERROR = -32603;

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
        value: child
    });
    Object.defineProperty(child.prototype, '_parent', {
        enumerable: false,
        value: parent
    });
};

var ObjectToArray = function (object) {
    return Object.keys(object).map(function (key) {
        return object[key];
    })
};