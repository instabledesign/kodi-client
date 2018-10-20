import KodiClient from '../src/KodiClient.js';
import KodiRequest from '../src/KodiRequest.js';

describe('Testing KodiClient', function () {
    it('send', function () {
        const fakeTransport = {send: function(){}};
        spyOn(fakeTransport, 'send').and.returnValue('fake_handler_return');

        let kodiClient = KodiClient(fakeTransport.send);

        expect(kodiClient.send('fake_request', 'fake_options')).toEqual('fake_handler_return');
        expect(fakeTransport.send).toHaveBeenCalledWith('fake_request', 'fake_options');
    });

    it('request default factory', function () {
        const fakeTransport = {send: function(){}};
        spyOn(fakeTransport, 'send').and.returnValue('fake_handler_return');

        let kodiClient = KodiClient(fakeTransport.send);

        expect(kodiClient.request('fake_request', 'fake_params', 'fake_options')).toEqual('fake_handler_return');
        expect(fakeTransport.send).toHaveBeenCalledWith(KodiRequest(1, { method: 'fake_request', params: 'fake_params' }), 'fake_options');
    });

    it('request custom factory', function () {
        const fakeTransport = {send: function(){}};
        spyOn(fakeTransport, 'send').and.returnValue('fake_handler_return');

        const fakeFactory = {create: function(){}};
        spyOn(fakeFactory, 'create').and.returnValue('fake_factory_return');

        let kodiClient = KodiClient(fakeTransport.send).factory(fakeFactory.create);

        expect(kodiClient.request('fake_request', 'fake_params', 'fake_options')).toEqual('fake_handler_return');
        expect(fakeTransport.send).toHaveBeenCalledWith('fake_factory_return', 'fake_options');
    });
});