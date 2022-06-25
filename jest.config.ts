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
            useESM: true
        },
    },
    transformIgnorePatterns: [
        "node_modules/(?!@babylonjs/core)/"
    ],
    moduleNameMapper: {
        "\\.(glsl|jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "jest-transform-stub",
        "\\.(css|less)$": "tests/__mocks__/styleMock.js"
    },
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}
export default config;