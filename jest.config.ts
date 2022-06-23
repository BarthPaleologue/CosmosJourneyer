import type {Config} from '@jest/types';
// Sync object
const config: Config.InitialOptions = {
    roots: ["./tests"],
    verbose: true,
    transform: {
        "^.+\\.ts$": "ts-jest",
        "^.+\\.(js|jsx)$": "babel-jest"
    },
    globals: {
        'ts-jest': {
            babelConfig: true,
        },
    },
    transformIgnorePatterns: [
        "node_modules/(?!@babylonjs/core)/"
    ],
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}
export default config;