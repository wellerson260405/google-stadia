const _webpack = require('webpack');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const BuildManifestPlugin = require('./webpack.manifest');

const srcDir = path.join(__dirname, '..', 'src');

module.exports = (env) => ({
  entry: {
    popup: path.join(srcDir, 'popup.tsx'),
    background: path.join(srcDir, 'background.ts'),
    content_script: path.join(srcDir, 'content_script.ts'),
    injected: path.join(srcDir, 'injected.ts'),
  },
  output: {
    path: path.join(__dirname, '../dist/js'),
    filename: '[name].js',
  },
  optimization: {
    splitChunks: {
      name: 'vendor',
      chunks(chunk) {
        return chunk.name !== 'background';
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: '.', to: '../', context: 'public' }],
      options: {},
    }),
    new BuildManifestPlugin({
      browser: env.browser,
      pretty: env.mode === 'production',
    }),
  ],
});
