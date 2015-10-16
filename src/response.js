var Response = function (rawResponse) {
    if (rawResponse == undefined || rawResponse == '') {
        throw new Exception('The JSON-RPC is empty.');
    }

    try {
        Object.assign(this, JSON.parse(rawResponse))
    }
    catch (e) {
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
    toString: function () {
        return JSON.stringify(this);
    },
    isError: function () {
        return this.hasOwnProperty('error')
    },
    getError: function () {
        if (this.isError()) {
            return {};
        }

        return false;
    },
    getResult: function () {
        return this.result;
    }
};
