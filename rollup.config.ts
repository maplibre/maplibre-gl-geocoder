import dts from 'rollup-plugin-dts';
import typescript from '@rollup/plugin-typescript';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import type {RollupOptions} from 'rollup';

const name = 'maplibre-gl-geocoder';

const config: RollupOptions[] = [
  {
    input: 'lib/index.ts',
    plugins: [
        commonjs(),
        nodeResolve({
            browser: true,
            preferBuiltins: false
        }), 
        typescript()
    ],
    output: [
      {
        file: `dist/${name}.js`,
        format: 'umd',
        sourcemap: true,
        name: 'MaplibreGeocoder',
      },
      {
        file: `dist/${name}.mjs`,
        format: 'es',
        sourcemap: true,
      },
    ],
  },
  {
    input: 'lib/index.ts',
    plugins: [dts()],
    output: {
      file: `dist/${name}.d.ts`,
      format: 'es',
    },
  },
];

export default config;