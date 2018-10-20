import KodiResponse from '../src/KodiResponse.js';

describe('Testing KodiResponse', function () {
    [
        true,
        1,
        'value',
        ['value']
    ].forEach(function(data){
        it('construct with bad data ' + JSON.stringify(data), function () {
            expect(function(){KodiResponse(data);}).toThrowError(TypeError, 'Data must be an object.');
        });
    });

    it('construct', function () {
        const response = KodiResponse({'fake_field': 'fake_value'});
        expect(response.fake_field).toEqual('fake_value');
    });
});