const webpack = require('webpack');
const fs = require('fs');
const path = require('path');

// Read version from manifest.json
const manifestPath = path.resolve(__dirname, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
const version = manifest.version;

module.exports = (env, argv) => {
    // Determine if the build is for production
    const isProduction = argv.mode === 'production';

    return {
        entry: {
            content: './js/content.js',
            background: './js/background.js',
            popup: './js/popup.js'
        },
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: '[name].js'
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    }
                }
            ]
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.DEBUG_MODE': JSON.stringify(!isProduction),
                'process.env.VERSION': JSON.stringify(version),
            }),
        ],
        optimization: {
            minimize: isProduction
        },
        devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
    };
};
