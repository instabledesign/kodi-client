import {Exception, InvalidJsonRpc} from './exceptions.js'

export default class Response {
    constructor(rawResponse) {
        var ERROR_PARSING            = -32700;
        var ERROR_INVALID_REQUEST    = -32600;
        var ERROR_METHOD_NOT_FOUND   = -32601;
        var ERROR_INVALID_PARAMETERS = -32602;
        var ERROR_INTERNAL_ERROR     = -32603;
        var ERROR_SERVER_ERROR       = -32000;
        var jsonrpc = "2.0";

        if (rawResponse == undefined || rawResponse == '') throw new Exception('The JSON-RPC is empty.');

        try {
            Object.assign(this, JSON.parse(rawResponse))
        }
        catch (e){
            throw new InvalidJsonRpc('The JSON-RPC response is not valid.', ERROR_PARSING);
        }

        if (this.hasOwnProperty('jsonrpc') && (this.jsonrpc == '' || this.jsonrpc < jsonrpc)) {
            throw new InvalidJsonRpc('The JSON-RPC response version is not supported.');
        }

        if (!this.hasOwnProperty('result') && !this.hasOwnProperty('error')) {
            throw new Exception('The JSON-RPC response must have a result or error property.');
        }
    }

    toString() {
        return JSON.stringify(this);
    }

    isError() {
        return this.hasOwnProperty('error')
    }

    getError() {
        if (this.isError()) {
            return {};
        }

        return false;
    }

    getResult() {
        return this.result;
    }
}