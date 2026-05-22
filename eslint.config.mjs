import eslint from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import { importX } from "eslint-plugin-import-x";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

const projectConfigs = [
    "./packages/babylonjs-shading-language/tsconfig.json",
    "./packages/channel-packer/tsconfig.json",
    "./packages/desktop-electron/tsconfig.json",
    "./packages/game/tsconfig.json",
    "./packages/physics/tsconfig.json",
    "./packages/universe-generation/tsconfig.json",
    "./packages/universe-model/tsconfig.json",
    "./packages/website/tsconfig.json",
];
const tsParserOptions = {
    projectService: true,
    tsconfigRootDir: import.meta.dirname,
};

const withProjectService = (config) => ({
    ...config,
    languageOptions: {
        ...(config.languageOptions ?? {}),
        parserOptions: {
            ...(config.languageOptions?.parserOptions ?? {}),
            ...tsParserOptions,
        },
    },
});

const strictTypeChecked = tseslint.configs.strictTypeChecked.map(withProjectService);

const nextConfigFiles = ["packages/website/**/*.{js,jsx,ts,tsx}", "eslint.config.mjs"];
const nextCoreWebVitalsSource = nextPlugin.flatConfig?.coreWebVitals ?? {
    plugins: {
        "@next/next": nextPlugin,
    },
    rules: nextPlugin.configs["core-web-vitals"]?.rules ?? {},
};
const nextRules = {
    ...(nextCoreWebVitalsSource.rules ?? {}),
    "@next/next/no-html-link-for-pages": "off",
};
const nextCoreWebVitals = {
    ...nextCoreWebVitalsSource,
    files: nextConfigFiles,
    rules: nextRules,
    settings: {
        ...(nextCoreWebVitalsSource.settings ?? {}),
        next: {
            ...(nextCoreWebVitalsSource.settings?.next ?? {}),
            rootDir: ["packages/website/"],
        },
    },
};

const typeScriptWorkspaceRules = {
    files: ["packages/**/*.{ts,tsx,js,jsx}"],
    settings: {
        "import-x/resolver": {
            typescript: {
                project: projectConfigs,
                alwaysTryTypes: true,
            },
        },
    },
    languageOptions: {
        parserOptions: tsParserOptions,
        ecmaVersion: "latest",
        sourceType: "module",
    },
    rules: {
        "import-x/no-cycle": "error",
        "import-x/no-duplicates": ["error", { "prefer-inline": true }],

        "@typescript-eslint/switch-exhaustiveness-check": "error",
        "@typescript-eslint/no-inferrable-types": "error",
        "@typescript-eslint/require-array-sort-compare": "error",
        "@typescript-eslint/strict-boolean-expressions": "error",

        "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],

        "@typescript-eslint/no-misused-promises": [
            "error",
            {
                checksVoidReturn: false,
            },
        ],

        "@typescript-eslint/restrict-template-expressions": [
            "error",
            {
                allowNumber: true,
                allowBoolean: true,
            },
        ],

        "@typescript-eslint/no-deprecated": "warn",
        "@typescript-eslint/no-unnecessary-condition": "warn",

        // enforce ===
        eqeqeq: "error",

        // no Promise.reject()
        "no-restricted-syntax": [
            "error",
            {
                selector: "CallExpression[callee.object.name='Promise'][callee.property.name='reject']",
                message: "Using Promise.reject() is not allowed. Consider using Promise<Result> instead.",
            },
        ],

        // naming conventions
        "@typescript-eslint/naming-convention": [
            "error",
            { selector: "enumMember", format: ["UPPER_CASE"] },
            {
                selector: "memberLike",
                modifiers: ["public", "static"],
                format: ["PascalCase", "UPPER_CASE"],
                leadingUnderscore: "forbid",
            },
            {
                selector: "memberLike",
                modifiers: ["private", "static"],
                format: ["PascalCase", "UPPER_CASE"],
                leadingUnderscore: "forbid",
            },
            { selector: "typeLike", format: ["PascalCase"] },
            {
                selector: "variable",
                modifiers: ["exported", "const", "global"],
                format: ["PascalCase", "camelCase"],
                leadingUnderscore: "forbid",
            },
            {
                selector: "function",
                format: ["camelCase", "snake_case", "PascalCase"],
                leadingUnderscore: "forbid",
            },
            {
                selector: "function",
                modifiers: ["exported", "global"],
                format: ["camelCase", "PascalCase"],
                leadingUnderscore: "forbid",
            },
            { selector: "interface", format: ["PascalCase"], leadingUnderscore: "forbid" },
            { selector: "class", format: ["PascalCase"], leadingUnderscore: "forbid" },
        ],
    },
};

export default defineConfig([
    globalIgnores([
        "packages/game/src/ts/utils/TWGSL/**",
        "packages/game/rspack.config.js",
        "tsconfig.json",
        "packages/desktop-electron/dist",
        "packages/desktop-electron/release",
        "packages/game/dist",
        "packages/channel-packer/dist",
        "packages/babylonjs-shading-language/doc",
        "packages/game/doc",
        "packages/game/src/asset",
        "coverage",
        ".eslintcache",
        "packages/website/.next",
        "packages/website/out",
        "packages/website/next.config.js",
        "packages/website/next-env.d.ts",
    ]),
    eslint.configs.recommended,
    ...strictTypeChecked,
    importX.flatConfigs.recommended,
    importX.flatConfigs.typescript,
    nextCoreWebVitals,
    typeScriptWorkspaceRules,
]);
