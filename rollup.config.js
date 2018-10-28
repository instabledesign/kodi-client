export default [
    {
        input: 'src/index.js',
        output: {
            file: 'dist/kodi.js',
            format: 'umd',
            name: 'Kodi',
            sourcemap: true
        },
    },
    // {
    //     input: 'src/index2.js',
    //     output: {
    //         file: 'dist/kodi2.js',
    //         format: 'umd',
    //         name: 'Kodi',
    //         sourcemap: true
    //     },
    // },
];