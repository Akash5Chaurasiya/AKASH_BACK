const path = require("path");
var nodeExternals = require('webpack-node-externals');

module.exports = {
    mode: 'development',
    watch: true,
    entry: path.resolve(__dirname, "./src/server.ts"),
    target: "node",
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: "ts-loader",
                // include: [path.resolve(__dirname, "/src")],
                exclude: path.resolve(__dirname, "node_modules"),
            },
        ],
    },
    output: {
        filename: "server.js",
        path: path.resolve(__dirname, "public"),
    },
    resolve: {
        extensions: [".ts", ".js"],
        alias: {
            "@src": path.resolve("src"),
        },
    },
    externalsPresets: {
        node: true, // in order to ignore built-in modules like path, fs, etc.
    },
    externals: [nodeExternals()]
};
