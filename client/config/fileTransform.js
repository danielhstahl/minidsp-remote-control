import path from "path"
export default {
    process(src, filename) {
        const assetFilename = JSON.stringify(path.basename(filename));
        return `module.exports = ${assetFilename};`;
    },
};