import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
    {
        input: 'src/index.js',
        output: {
            file: 'dist/kodi.umd.js',
            format: 'umd',
            name: 'Kodi',
            sourcemap: true
        },
        plugins: [
            resolve(),
            commonjs()
        ]
    },
    {
        input: 'src/index.js',
        // external: ['ms'],
        output: [
            {file: 'dist/kodi.cjs.js', format: 'cjs'},
            {file: 'dist/kodi.esm.js', format: 'es'}
        ]
    }
];
