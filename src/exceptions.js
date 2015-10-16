var Exception = function (message, code, parent) {
    this.message = message || '';
    this.code = code;
    this.parent = parent;
};

Exception.prototype.toString = function () {
    var getAncestorMessage = function (e) {
        var eMessage = e.message;
        if (e.parent) {
            eMessage += '\n' + getAncestorMessage(e.parent);
        }

        return eMessage;
    };

    return getAncestorMessage(this);
};

var InvalidJsonRpc = function (message, code) {
    this.message = message;
    this.code = code;
};
extend(InvalidJsonRpc, Exception);

var InvalidArgumentException = function (object, type, message) {
    this._parent.call(this, 'Need to be an "' + type + '". "' + typeof(object) + '" given.' + (message || ''));
};
extend(InvalidArgumentException, Exception);

var InvalidRequestException = function (request, parent) {
    this.request = request;
    this._parent.call(this, 'Invalid request "' + request + '".', null, parent);
};

extend(InvalidRequestException, Exception);
