import cosmosPlugin from "@cosmos-journeyer/eslint-plugin";
import eslint from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import { importX } from "eslint-plugin-import-x";
import jsdoc from "eslint-plugin-jsdoc";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

const projectConfigs = [
    "./packages/babylonjs-shading-language/tsconfig.json",
    "./packages/channel-packer/tsconfig.json",
    "./packages/desktop-electron/tsconfig.json",
    "./packages/eslint-plugin/tsconfig.json",
    "./packages/game/tsconfig.json",
    "./packages/gaia-explorer/tsconfig.json",
    "./packages/physics/tsconfig.json",
    "./packages/random/tsconfig.json",
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
const stylisticTypeChecked = tseslint.configs.stylisticTypeChecked.map(withProjectService);

const nextConfigFiles = ["packages/website/**/*.{js,jsx,ts,tsx,mts}", "eslint.config.mts"];
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
    files: ["packages/**/*.{ts,tsx,js,jsx,mts}"],
    extends: [cosmosPlugin.configs.all],
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
                            "packages/random/src",
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
        "@typescript-eslint/require-array-sort-compare": "error",
        "@typescript-eslint/strict-boolean-expressions": "error",

        "@typescript-eslint/consistent-type-imports": "error",

        "@typescript-eslint/consistent-type-exports": "error",

        // no type assertions by default; `as const` and `satisfies` stay allowed, exceptions need a justified line-scoped disable
        "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
        "@typescript-eslint/no-non-null-assertion": "error",

        "@typescript-eslint/prefer-readonly": "error",

        "@typescript-eslint/no-shadow": "error",

        "@typescript-eslint/promise-function-async": "error",

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
        "@typescript-eslint/no-unsafe-type-assertion": "error",

        // enforce ===
        eqeqeq: "error",

        // maximum block nesting depth
        "max-depth": ["error", 3],

        // maximum cyclomatic complexity
        complexity: ["warn", { max: 15, variant: "modified" }],

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

// Require readonly parameters in pure TypeScript libraries.
const pureLibraryRules = {
    files: ["packages/{gaia-explorer,physics,random,typescript,universe-generation,universe-model}/**/*.{ts,tsx}"],
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
    ...stylisticTypeChecked,
    {
        rules: {
            "@typescript-eslint/array-type": ["error", { default: "generic" }],
            // Data records use types and class contracts use interfaces.
            "@typescript-eslint/consistent-type-definitions": "off",
            // The strict preset forbids non-null assertions.
            "@typescript-eslint/non-nullable-type-assertion-style": "off",
            // Optional calls can produce nullable booleans rejected by strict-boolean-expressions.
            "@typescript-eslint/prefer-optional-chain": "off",
            "@typescript-eslint/prefer-string-starts-ends-with": ["error", { allowSingleElementEquality: "always" }],
        },
    },
    jsdoc.configs["flat/recommended-typescript-error"],
    importX.flatConfigs.recommended,
    importX.flatConfigs.typescript,
    nextCoreWebVitals,
    typeScriptWorkspaceRules,
    {
        // Playgrounds are non-persistent demo scenes by role, not by file name: implicit randomness stays allowed there.
        files: ["packages/game/src/ts/playgrounds/**/*.ts"],
        rules: {
            "cosmos/no-implicit-random": "off",
        },
    },
    {
        files: ["**/*.{spec,test}.{ts,tsx,mts,cts}"],
        rules: {
            "@typescript-eslint/dot-notation": ["error", { allowPrivateClassPropertyAccess: true }],
            "@typescript-eslint/no-empty-function": "off",
        },
    },
    pureLibraryRules,
    {
        // Babylon.js material factories and loaders return class instances indirectly.
        files: ["packages/game/**/*.{ts,tsx,js,jsx,mts}"],
        rules: {
            "@typescript-eslint/no-unsafe-class-instance-assignment": "off",
        },
    },
]);
