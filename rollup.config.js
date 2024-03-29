import {nodeResolve} from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import postcss from 'rollup-plugin-postcss'

export default {
    input: 'assets/js/index.js',
    output: {
        file: 'assets/js/app.js',
        format: 'iife',
        name: 'myapp'
    },
    plugins: [
        postcss({
            extract: true,
        }),
        nodeResolve({
            browser: true
        }),
        commonjs(),
    ],
}
