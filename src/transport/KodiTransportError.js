function TransportError(message, extraData) {
    let instance = new Error(message);
    instance.name = 'TransportError';
    instance.extraData = extraData;
    Object.setPrototypeOf(instance, Object.getPrototypeOf(this));
    if(Error.captureStackTrace) {
        Error.captureStackTrace(instance, TransportError);
    }
    return instance;
}

TransportError.prototype = Object.create(Error.prototype, {
    constructor: {
        value: Error,
        enumerable: false,
        writable: true,
        configurable: true
    }
});

if (Object.setPrototypeOf){
    Object.setPrototypeOf(TransportError, Error);
} else {
    TransportError.__proto__ = Error;
}

export default TransportError;
