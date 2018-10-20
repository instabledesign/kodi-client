export default (middlewares, handler) => middlewares.reverse().reduce(
    (prev, cur) => null === prev ? cur : cur(prev),
    handler
);
