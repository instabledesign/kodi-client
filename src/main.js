import KodiClient from './kodi-client.js'

var client = new KodiClient({
    websocket: {
        url: 'ws://localhost:9090'
    },
    ajax: {
        open: {
            method: 'POST',
            url:    'http://localhost:8080/jsonrpc',
        }
    }
});

client.call('JSONRPC.Ping').then(function(data) {
    console.log(data);
});

client.call('JSONRPC.Introspect').then(function(data) {
    console.log(data);
});
