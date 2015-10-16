var Request = function (methodName, parameters, id) {
    this.jsonrpc = JSONRPC_VERSION;
    this.id = id || 0;
    this.method = methodName;
    this.params = parameters || {};
};

Request.prototype.toString = function () {
    return JSON.stringify(this);
};
