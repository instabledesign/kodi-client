export default (notifier, middlewares) => callback => notifier(
    middlewares.reverse().reduce(
        (prev, cur) => null === prev ? cur : cur(prev),
        callback
    )
);
