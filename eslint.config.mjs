import eslint from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import importPlugin from "eslint-plugin-import";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

const projectConfigs = ["./packages/game/tsconfig.json", "./packages/website/tsconfig.json"];

const strictTypeChecked = tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    languageOptions: {
        ...(config.languageOptions ?? {}),
        parserOptions: {
            ...(config.languageOptions?.parserOptions ?? {}),
            projectService: true,
            project: projectConfigs,
            tsconfigRootDir: import.meta.dirname,
        },
    },
}));

const nextCoreWebVitalsRules = nextPlugin.configs["core-web-vitals"]?.rules ?? {};
const nextCoreWebVitals = {
    files: ["packages/website/**/*.{js,jsx,ts,tsx}"],
    plugins: {
        "@next/next": nextPlugin,
    },
    rules: nextCoreWebVitalsRules,
};

export default defineConfig([
    globalIgnores([
        "packages/game/src/ts/utils/TWGSL/**",
        "packages/game/src-tauri",
        "packages/game/rspack.config.js",
        "tsconfig.json",
        "eslint.config.mjs",
        "packages/game/dist",
        "packages/game/doc",
        "packages/game/src/asset",
        "coverage",
        ".eslintcache",
        "packages/website/.next",
        "packages/website/out",
        "packages/website/next.config.js",
    ]),
    eslint.configs.recommended,
    ...strictTypeChecked,
    importPlugin.flatConfigs.recommended,
    importPlugin.flatConfigs.typescript,
    nextCoreWebVitals,
    {
        files: ["packages/**/*.{ts,tsx,js,jsx}"],
        settings: {
            "import/resolver": {
                typescript: {
                    project: projectConfigs,
                    alwaysTryTypes: true,
                },
            },
        },
        languageOptions: {
            parserOptions: {
                projectService: true,
                project: projectConfigs,
                tsconfigRootDir: import.meta.dirname,
            },
            ecmaVersion: "latest",
            sourceType: "module",
        },
        rules: {
            "import/no-cycle": "error",

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
    },
]);
