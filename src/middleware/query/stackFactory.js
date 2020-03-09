export default (handler, middlewares) => {
    if (!middlewares) {
        return handler;
    }
    return middlewares.reverse().reduce(
        (prev, cur) => null === prev ? cur : cur(prev),
        handler
    );
}
