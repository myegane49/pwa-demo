const path = require('path');

module.exports = {
    entry: {
        index: './public/src/index.js',
        sw: './public/src/serviceWorker.js'
    },
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: '[name].js'
    }
}