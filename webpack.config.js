const path = require('path');

module.exports = {
  target: 'node',
  entry: path.resolve('src/server.js'),
  output: {
    filename: 'server.js',
    path: path.resolve('build'),
    libraryTarget: 'commonjs2',
  },
  externals: /^[^.\/]/,
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel',
        query: {
          presets: ['es2015'],
          cacheDirectory: 'babel_cache',
        },
      },
    ],
  },
};
