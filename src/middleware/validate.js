import Ajv from 'ajv';

function validate() {
    if (!(this instanceof validate)) {
        return new validate();
    }

    const ajv = new Ajv();
    this.schema = null;

    return handler => (request, options) => {
        if (this.schema) {
            console.log(this.schema, request.toJson());
            const valid = ajv.validate(this.schema, request.toJson());
            console.log(valid);
            return 'tyu';
        }

        if (request.method === 'JSONRPC.Introspect') {
            return handler(request, options).then(data => {
                this.schema = data.result;

                return data;
            });
        }

        return handler(request, options);
    };
}

export default validate;