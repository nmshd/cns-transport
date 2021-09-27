const path = require("path")
const webpack = require("webpack")

module.exports = {
    mode: "development",
    node: {
        global: true
    },
    entry: "./dist-test/index.web",
    output: {
        path: path.resolve(__dirname, "lib-web"),
        filename: "nmshd.transport.test.js",
        library: "NMSHDTest",
        umdNamedDefine: true
    },
    resolve: {
        extensions: [".js", ".json"],
        alias: {
            src: path.resolve(__dirname, "tmp-browser/src/")
        }
    },
    devtool: "source-map",
    externals: {
        chai: "chai",
        lokijs: "loki",
        http: "NMSHDCrypto",
        https: "NMSHDCrypto",
        process: "NMSHDCrypto",
        path: "NMSHDCrypto",
        assert: "NMSHDCrypto",
        util: "NMSHDCrypto",
        "fs-extra": "NMSHDCrypto",
        fs: "NMSHDCrypto",
        "@js-soft/node-logger": "NMSHDCrypto",
        "@nmshd/transport": "NMSHDTransport",
        "@nmshd/crypto": "NMSHDCrypto",
        "@js-soft/ts-serval": "TSServal",
        "@js-soft/docdb-access-mongo": "NMSHDCrypto"
    }
}
