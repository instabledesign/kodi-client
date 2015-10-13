class Exception {
    constructor(message, code) {
        this.message = message || '';
        this.code = code;
    }

    toString() {
        return this.message;
    }
}

class Fault extends Exception {
    constructor(message, code) {
        super(message, code);
    }
}

class InvalidJsonRpc extends Exception {
    constructor(message, code) {
        super(message, code);
    }
}

class InvalidArgumentException extends Exception {
    constructor (object, type, message) {
        super('Need to be an "' + type + '". "' + typeof(object) + '" given.' + (message || ''));
    }
}

export {Exception, Fault, InvalidJsonRpc, InvalidArgumentException}