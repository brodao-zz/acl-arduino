/* eslint-disable @typescript-eslint/naming-convention */
//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

"use strict";

const path = require("path");
const merge = require("merge-options");

var devMode = false;
const index = process.argv.indexOf("--mode");
if (index !== -1) {
  devMode = process.argv[index + 1] !== "production";
}

module.exports = function withDefaults(/**@type WebpackConfig*/ extConfig) {
  /** @type WebpackConfig */
  let defaultConfig = {
    mode: "none", // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
    target: "node", // extensions run in a node context
    node: {
      __dirname: false, // leave the __dirname-behaviour intact
    },
    resolve: {
      mainFields: ["module", "main"],
      extensions: [".ts", ".js"], // support ts-files and js-files
    },
    stats: { errorDetails: true },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [
            {
              // configure TypeScript loader:
              // * enable sources maps for end-to-end source maps
              loader: "ts-loader",
              options: {
                compilerOptions: {
                  sourceMap: devMode,
                },
              },
            },
          ],
        },
      ],
    },
    externals: {
      vscode: "commonjs vscode", // ignored because it doesn't exist
      electron: "electron", // ignored because it doesn't exist
    },
    output: {
      // all output goes into `dist`.
      // packaging depends on that and this must always be like it
      filename: "[name].js",
      path: path.join(extConfig.context, "out"),
      libraryTarget: "commonjs",
    },
    // yes, really source maps
    devtool: devMode ? "source-map" : false,
  };

  return merge(defaultConfig, extConfig);
};
