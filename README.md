# Kodi Client

This libraryis dependency free and gonna help developer to do JSONRPC call over Kodi.

It come with some feature like:

- Kodi client (perform request)
- Kodi client RPC (simplify API to made call easy)
- In memory Cache
- Local storage Cache
- Cache middleware
- Logging middleware
- Web socket transport
- XMLHTTPRequest transport
- 🚧 WIP Validator middleware (to help request debugging)
- 🚧 TODO An ORM like to query/update/cache kodi content (movie/song/etc)
- 🚧 TODO reactivate the Kodi notification message (via event emitter or observable pattern)

## RPC client

### Query kodi

The RPC client provide all Kodi namespace with all method in it.

This client has a `onReady` promise witch is resolved (with the client and the schema) when kodi introspection was done

You just have to call the right method like `kodi.{NAMESPACE}.{METHOD}({PARAMS})`

```js
let kodi = Kodi.createClientRPC({uri: 'ws://localhost:9090'});
kodi.onReady.then(() => {
    kodi.JSONRPC.Ping().then(data => {
        console.log(data);
    });
});
```

or you can do it synchronously

```js
let kodi = Kodi.createClientRPC({uri: 'ws://localhost:9090'});
await kodi.onReady;
kodi.JSONRPC.Ping().then(data => {
    console.log(data);
});
```

to call method with required params you can do like that

```js
let kodi = Kodi.createClientRPC({uri: 'ws://localhost:9090'});
kodi.onReady.then(() => {
    kodi.JSONRPC.Introspect({getdescriptions: true, getmetadata: true, filterbytransport: true}).then(data => {
        console.log(data);
    });
});
```

###To listen kodi event

Kodi emit some notification event when it append something on kodi

You can attach a listener to kodi notification

```js
let kodi = Kodi.createClientRPC({uri: 'ws://localhost:9090'});
kodi.onReady.then(() => {
    kodi.Player.OnResume(data => {
        console.log(data);
    });
});
```

## Simple client

### Query kodi

The client provide only `request` and `send` method.

You just have to call the right method like `kodi.request("{NAMESPACE}.{METHOD}", {PARAMS})`

```js
let kodi = Kodi.createClient({uri: 'ws://localhost:9090'});

kodi.request('JSONRPC.Ping').then(data => {
    console.log(data);
});
```
to call method with required params you can do like that

```js
let kodi = Kodi.createClient({uri: 'ws://localhost:9090'});

kodi.request('JSONRPC.Introspect', {getdescriptions: true, getmetadata: true, filterbytransport: true}).then(data => {
    console.log(data);
});
```

###To listen kodi event

Kodi emit some notification event when it append something on kodi

You can attach a listener to kodi notification

```js
let kodi = Kodi.createClient({uri: 'ws://localhost:9090'});

kodi.addNotificationListener(data => {
    console.log(data);
});
```

## Advanced usage

### Configuration options

Kodi client and RPC client allow you to custom some internal feature.

```js
Kodi.createClient({
    uri: 'your custom uri',// default: ws://${window.location}:9090 or fallback http://${window.location}:8080/jsonrpc
    transport: new YourCustomTransport(),// default: if path ws:// new KodiWebSocketTransport() or fallback new KodiXMLHttpTransport() 

    cache: new YourCustomCache(),// default: new LocalStorageCache('request_') or fallback new InMemoryCache()
    TTL: 60000,// response cache Time To Live in ms default: 10000 ms
    cacheMiddleware: new YourCustomCacheMiddleware(),// default new CacheMiddleware(withTTL(cache, TTL))

    middlewares: ['your_middleware', 'your_middleware2'],// default: [LoggingMiddleware, cacheMiddleware]
    handler: your_custom_handler// default: compose with middlewares and transport.send
})
```

### Request handler

The only client dependency was the request handler. His purpose is to take a KodiRequest and return KodiResponse.

You can set your own request handler in the construct options.

```js
let kodi = Kodi.createClient({
    uri: 'ws://localhost:9090',
    handler: function(request){return new Promise((resolve, reject) => {
        resolve(Kodi.KodiResponse());
    });}
});

kodi.request('JSONRPC.Introspect', {getdescriptions: true, getmetadata: true, filterbytransport: true}).then(data => {
    console.log(data);
});
```

### Middlewares

The middleware was really usefull to add some behavior to the requesting process. The `CacheMiddleware` and `LoggingMiddleware` was already provided.

These middleware help to cached response and log what append during kodi RPC call.

> ℹ️ The ValidateMiddleware is currently in progress to return the proper request violations.

You can create or just add your middleware.

```js
let kodi = Kodi.createClient({
    uri: 'ws://localhost:9090',
    middlewares: [
        handler => (request, options) => {
            // your custom process before the request execution
            // you can edit request or options
        
            return handler(request, options).then(data => {
                // your custom process when the request was done
                // your can edit the response
        
                return data;
            });
        }
    ]
});

kodi.request('JSONRPC.Introspect', {getdescriptions: true, getmetadata: true, filterbytransport: true}).then(data => {
    console.log(data);
});
```

The `CacheMiddleware` was also great to catch the response in order to increase the response time when the cache was warm up.

You can use provided cache implementation (`InMemory`/`LocalStorage`). You can also configure your own cache response provider. 
you can change the TTL (time to live param).

```js
let kodi = Kodi.createClient({
    uri: 'ws://localhost:9090',
    TTL: 100000// duration in ms
});

kodi.request('JSONRPC.Introspect', {getdescriptions: true, getmetadata: true, filterbytransport: true}).then(data => {
    console.log(data);
});
// if you do the same request with the same attributes you get the response from the cache
```

### Request transport

The default transport was `KodiWebSocketTransport` if the passed uri contain `ws://` and if the browser support it.
Fallback to KodiXMLHttpTransport

```js
let kodi = Kodi.createClient({uri: 'ws://localhost:9090'});

kodi.request('JSONRPC.Introspect', {getdescriptions: true, getmetadata: true, filterbytransport: true}).then(data => {
    console.log(data);
});
```
