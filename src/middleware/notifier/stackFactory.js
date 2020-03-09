export default (notifier, middlewares) => handler => {
    if (!middlewares) {
        return notifier(handler);
    }
    return notifier(
        middlewares.reverse().reduce(
            (prev, cur) => null === prev ? cur : cur(prev),
            handler
        )
    );
}
