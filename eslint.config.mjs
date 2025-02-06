import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [
    {
        ignores: [
            "src/ts/utils/TWGSL",
            "node_modules",
            "src-tauri",
            "webpack.config.js",
            "tsconfig.json",
            "eslint.config.mjs",
            "dist",
            "docs",
            "src/asset",
            "coverage"
        ]
    },
    ...fixupConfigRules(
        compat.extends(
            "eslint:recommended",
            "plugin:@typescript-eslint/recommended",
            "plugin:import/errors",
            "plugin:import/warnings",
            "plugin:import/typescript"
        )
    ),
    {
        plugins: {
            "@typescript-eslint": fixupPluginRules(typescriptEslint)
        },

        languageOptions: {
            globals: {
                ...globals.browser
            },

            parser: tsParser,
            ecmaVersion: "latest",
            sourceType: "module",

            parserOptions: {
                project: "./tsconfig.json"
            }
        },

        rules: {
            "import/no-cycle": "error",
            "import/no-unresolved": "warn",

            "@typescript-eslint/switch-exhaustiveness-check": "error",

            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/no-inferrable-types": "warn",
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-explicit-any": "warn",
            eqeqeq: "error",

            "no-restricted-syntax": [
                "error",
                {
                    selector: "TSEnumDeclaration:not([const=true])",
                    message: "Don't declare non-const enums"
                }
            ],

            "@typescript-eslint/naming-convention": [
                "error",
                {
                    selector: "enumMember",
                    format: ["UPPER_CASE"]
                },
                {
                    selector: "memberLike",
                    modifiers: ["public", "static"],
                    format: ["PascalCase", "UPPER_CASE"],
                    leadingUnderscore: "forbid"
                },
                {
                    selector: "memberLike",
                    modifiers: ["private", "static"],
                    format: ["PascalCase", "UPPER_CASE"],
                    leadingUnderscore: "forbid"
                },
                {
                    selector: "typeLike",
                    format: ["PascalCase"]
                },
                {
                    selector: "variable",
                    modifiers: ["exported", "const", "global"],
                    format: ["PascalCase"],
                    leadingUnderscore: "forbid"
                },
                {
                    selector: "function",
                    format: ["camelCase", "snake_case"],
                    leadingUnderscore: "forbid"
                },
                {
                    selector: "function",
                    modifiers: ["exported", "global"],
                    format: ["camelCase"],
                    leadingUnderscore: "forbid"
                },
                {
                    selector: "interface",
                    format: ["PascalCase"],
                    leadingUnderscore: "forbid"
                },
                {
                    selector: "class",
                    format: ["PascalCase"],
                    leadingUnderscore: "forbid"
                }
            ],
            "@typescript-eslint/require-array-sort-compare": "error"
        }
    }
];
