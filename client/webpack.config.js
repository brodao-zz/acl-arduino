const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = (env, argv) => {
  return {
    externals: {
      vscode: "commonjs vscode", // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    },
    devtool: argv.mode === "production" ? false : "eval-source-map",
    optimization: {
      minimize: argv.mode === "production",
      minimizer: [new TerserPlugin()],
    },
    entry: {},
    output: {
      path: path.resolve(__dirname, "out", "app"),
      filename: "[name].js",
    },
    resolve: {
      extensions: [".js", ".ts", ".tsx", ".json"],
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          loader: "ts-loader",
          options: {},
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: "style-loader",
            },
            {
              loader: "css-loader",
            },
          ],
        },
      ],
    },
    target: "node",
    performance: {
      hints: "warning",
    },
  };
};
