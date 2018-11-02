export default handler => (request, options) => {
    console.log('Request %o', request);
    const startTime = Date.now();

    return handler(request, options).then(data => {
        const end = Date.now();
        console.log('Response %o in %d ms', data, end - startTime);

        return data;
    });
};