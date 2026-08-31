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
    "./packages/gaia-explorer/tsconfig.json",
    "./packages/physics/tsconfig.json",
    "./packages/typescript/tsconfig.json",
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
        "import-x/consistent-type-specifier-style": ["error", "prefer-top-level"],
        "import-x/no-duplicates": "error",
        "import-x/no-extraneous-dependencies": "error",
        "import-x/no-mutable-exports": "error",
        "import-x/no-relative-packages": "error",

        "import-x/no-restricted-paths": [
            "error",
            {
                basePath: import.meta.dirname,
                zones: [
                    {
                        target: [
                            "packages/babylonjs-shading-language/src",
                            "packages/physics/src",
                            "packages/typescript/src",
                            "packages/universe-generation/src",
                            "packages/universe-model/src",
                        ],
                        from: [
                            "packages/channel-packer",
                            "packages/desktop-electron",
                            "packages/game",
                            "packages/website",
                        ],
                        message: "Shared library packages must not depend on application packages.",
                    },
                ],
            },
        ],

        "no-warning-comments": ["warn", { terms: ["todo", "fixme", "xxx", "hack"] }],

        // enforce braces around control flow statements
        curly: "error",

        "no-implicit-coercion": "error",

        "@typescript-eslint/switch-exhaustiveness-check": "error",
        "@typescript-eslint/no-inferrable-types": "error",
        "@typescript-eslint/require-array-sort-compare": "error",
        "@typescript-eslint/strict-boolean-expressions": "error",

        "@typescript-eslint/consistent-type-imports": "error",

        "@typescript-eslint/consistent-type-exports": "error",

        "@typescript-eslint/prefer-readonly": "error",

        "@typescript-eslint/prefer-nullish-coalescing": "error",

        "@typescript-eslint/no-shadow": "error",

        "@typescript-eslint/promise-function-async": "error",

        "@typescript-eslint/explicit-function-return-type": "error",

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
        "@typescript-eslint/no-unsafe-type-assertion": "warn",

        // enforce ===
        eqeqeq: "error",

        // maximum block nesting depth
        "max-depth": ["error", 3],

        // maximum cyclomatic complexity
        complexity: ["warn", { max: 15, variant: "modified" }],

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

const readonlyParameterTypesConfig = {
    files: [
        "packages/physics/**/*.{ts,tsx}",
        "packages/typescript/**/*.{ts,tsx}",
        "packages/universe-generation/**/*.{ts,tsx}",
        "packages/universe-model/**/*.{ts,tsx}",
    ],
    rules: {
        "@typescript-eslint/prefer-readonly-parameter-types": [
            "error",
            {
                ignoreInferredTypes: true,
            },
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
    {
        linterOptions: {
            reportUnusedDisableDirectives: "error",
            reportUnusedInlineConfigs: "error",
        },
    },
    eslint.configs.recommended,
    ...strictTypeChecked,
    importX.flatConfigs.recommended,
    importX.flatConfigs.typescript,
    nextCoreWebVitals,
    typeScriptWorkspaceRules,
    readonlyParameterTypesConfig,
]);
