export default (handler, middlewares) => middlewares.reverse().reduce(
    (prev, cur) => null === prev ? cur : cur(prev),
    handler
);
