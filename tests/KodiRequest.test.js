import KodiRequest from '../src/KodiRequest.js';

describe('Testing KodiRequest', function () {
    [
        undefined,
        null,
        true,
        '',
        [],
        {}
    ].forEach(function(id){
        it('construct with bad id ' + JSON.stringify(id), function () {
            expect(function(){KodiRequest(id);}).toThrowError(TypeError, 'Id must be an integer.');
        });
    });

    [
        true,
        1,
        'value',
        ['value']
    ].forEach(function(options){
        it('construct with bad options ' + JSON.stringify(options), function () {
             expect(function(){KodiRequest(1, options);}).toThrowError(TypeError, 'Options must be an object.');
        });
    });

    [
        [
            undefined,
            '{"id":1,"jsonrpc":"2.0"}'
        ],
        [
            {'method': 'fake_method'},
            '{"id":1,"jsonrpc":"2.0","method":"fake_method"}'
        ],
        [
            {'method': 'fake_method', 'params': 'fake_params'},
            '{"id":1,"jsonrpc":"2.0","method":"fake_method","params":"fake_params"}'
        ],
    ].forEach(function(argument){
        it('toJson ' + JSON.stringify(argument[0]), function () {
            expect(KodiRequest(1, argument[0]).toJson()).toEqual(argument[1]);
        });
    });
});