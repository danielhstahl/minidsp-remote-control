import babelJest from 'babel-jest'
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const transformer = babelJest.createTransformer({
    presets: [
        [
            require.resolve('babel-preset-react-app'),
            {
                runtime: 'automatic'
            },
        ],
    ],
    babelrc: false,
    configFile: false,
});

export default transformer