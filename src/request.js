export default class Request {
    constructor(methodName, parameters = {}, id = 0) {
        this.jsonrpc = "2.0";
        this.id = id;
        this.method = methodName;
        this.params = parameters;
    }

    toString() {
        return JSON.stringify(this);
    }
}