import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

const external = [
  'aws-sdk',
  'node:buffer',
  'node:fs',
  'node:http',
  'node:https',
  'node:net',
  'node:path',
  'node:stream',
  'node:url',
  'node:util',
  'node:zlib',
  'unzipper',
];

const output = {
  format: 'cjs',
  exports: 'named',
  inlineDynamicImports: true,
};

const plugins = [resolve({ preferBuiltins: true }), commonjs(), json()];

const s3BucketWithContents = {
  input: 'dist/custom/s3BucketWithContents.js',
  output: {
    ...output,
    file: 'dist/s3BucketWithContents.js',
  },
  plugins,
  external,
};

const cloudFrontInvalidation = {
  input: 'dist/custom/cloudFrontInvalidation.js',
  output: {
    ...output,
    file: 'dist/cloudFrontInvalidation.js',
  },
  plugins,
  external,
};

export default [s3BucketWithContents, cloudFrontInvalidation];
