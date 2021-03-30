module.exports = {
  mode: "development",
  devtool: false,
  entry: "./src/index.ts",
  output: {
    path: __dirname + "/dist/www/",
    filename: "batch.js",
    libraryTarget: "commonjs"
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loader: "ts-loader" }
    ]
  }
};
