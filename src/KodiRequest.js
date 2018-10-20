const JSONRPC_VERSION = '2.0';

function KodiRequest(id, options) {
    if (!(this instanceof KodiRequest)) {
        return new KodiRequest(id, options);
    }

    if (options && 'object' !== Object.prototype.toString.call(options).split(" ").pop().split("]").shift().toLowerCase()) {
        throw new TypeError('Options must be an object.');
    }

    this.id = id;

    ({
        method: this.method,
        params: this.params,
        jsonrpc: this.jsonrpc = JSONRPC_VERSION
    } = options || {});
}

KodiRequest.prototype.toJson = function() {
    return JSON.stringify({
        id: this.id,
        jsonrpc: this.jsonrpc,
        method: this.method,
        params: this.params
    });
};

export default KodiRequest;