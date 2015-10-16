var Listenable = function (listeners) {
    this.listeners = {};
    for (var i in listeners) {
        this.listeners[listeners[i]] = [];
    }
};

Listenable.prototype = {
    hasListener: function (eventName) {
        return this.listeners.hasOwnProperty(eventName);
    },
    on: function (eventName, callback) {
        if (!this.hasListener(eventName)) {
            throw new Exception('Event "' + eventName + '" does\'nt exist.');
        }
        else if (typeof callback !== 'function') {
            throw new InvalidArgumentException(callback, 'function');
        }

        this.listeners[eventName].push(callback);
    },
    fire: function (eventName, value) {
        if (!this.hasListener(eventName)) {
            throw new Exception('Event "' + eventName + '" does\'nt exist.');
        }
        else {
            for (var i in this.listeners[eventName]) {
                this.listeners[eventName][i](value);
            }
        }
    }
};

