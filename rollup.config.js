import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import {terser} from 'rollup-plugin-terser';

import * as meta from "./package.json";

const copyright = `// ${meta.homepage} v${meta.version} Copyright ${(new Date).getFullYear()} ${meta.author.name}`;

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
            commonjs(),
        ]
    },
    {
        input: 'src/index.js',
        output: {
            file: 'dist/kodi.umd.min.js',
            format: 'umd',
            name: 'Kodi',
            sourcemap: true
        },
        plugins: [
            resolve(),
            commonjs(),
            terser({output: {preamble: copyright}}),
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
