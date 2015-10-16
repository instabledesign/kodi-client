var RequestValidator = function(jsonschema) {
    this.jsonschema = jsonschema;
};

RequestValidator.prototype = {
    validate: function(request) {
        try {
            this.validateMethod(request.method);
            this.validateParams(request.method, request.params);
        }
        catch(e) {
            throw new InvalidRequestException(request, e);
        }

        return true;
    },
    validateMethod: function(method) {
        var methods = Object.keys(this.jsonschema.methods);
        if (method === undefined || method === ''){
            throw new Exception('Request methods is required. Method list '+ methods.join(', '), REQUEST_INVALID_METHOD);
        }

        if (!this.hasMethod(method)){
            //TODO levenstein to purpose choices
            throw new Exception('Request method "' + method + '" doesn\'t exist.', REQUEST_INVALID_METHOD);
        }
    },
    validateParams: function(method, params){
        var methodSchema = this.jsonschema.methods[method];
        var paramsSchema = methodSchema.params;

        if (paramsSchema.length === 0) {
            if (ObjectToArray(params).length === 0) {
                return true;
            }
            else {
                throw new Exception('Request method "' + method + '" take no params. Excessive param ' + JSON.stringify(params) + ' given.');
            }
        }

        try {
            for (var param in params) {
                this.validateParam(paramsSchema, param, params[param]);
            }
        }
        catch(e) {
            throw new Exception('Invalid param for request method "' + method + '".', null, e);
        }
    },
    validateParam: function(paramsSchema, param, paramValue){
        var paramSchema;
        for (var i in paramsSchema) {
            if (paramsSchema[i].name === param) {
                paramSchema = paramsSchema[i];
                break;
            }
        }

        if (paramSchema === undefined) {
            throw new Exception('Unexpected param "' + param + '" given.');
        }

        var type = typeof paramValue;
        if (type !== paramSchema.type) {
            throw new Exception('Wrong param type for "' + param + '". Expected "' + paramSchema.type + '", "' + type + '"given.');
        }

        //TODO WORK IN PROGRESS
    },
    hasMethod: function(name) {
        return this.jsonschema.methods.hasOwnProperty(name);
    },
    hasNotifications: function(name) {
        return this.jsonschema.notifications.hasOwnProperty(name);
    }
};