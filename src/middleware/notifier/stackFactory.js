export default (notifier, middlewares) => handler => notifier(
    middlewares.reverse().reduce(
        (prev, cur) => null === prev ? cur : cur(prev),
        handler
    )
);
