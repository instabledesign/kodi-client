import KodiWebSocketTransport from '../src/KodiWebSocketTransport.js';

describe('Testing KodiWebSocketTransport', function () {
    [
        true,
        1,
        'value',
        ['value']
    ].forEach(function(data){
        it('construct with bad data ' + JSON.stringify(data), function () {
            expect(function(){KodiWebSocketTransport(data);}).toThrowError(TypeError, 'Data must be an object.');
        });
    });

    it('construct', function () {
        const response = KodiWebSocketTransport({'fake_field': 'fake_value'});
        expect(response.fake_field).toEqual('fake_value');
    });
});