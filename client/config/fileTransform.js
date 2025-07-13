const path = require('path').default;

module.exports = {
    process(src, filename) {
        const assetFilename = JSON.stringify(path.basename(filename));
        return `module.exports = ${assetFilename};`;
    },
};