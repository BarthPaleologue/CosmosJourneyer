import eslint from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";

export default defineConfig([
    globalIgnores([
        "src/ts/utils/TWGSL/**",
        "src-tauri",
        "rspack.config.js",
        "tsconfig.json",
        "eslint.config.mjs",
        "dist",
        "doc",
        "src/asset",
        "coverage",
        ".eslintcache"
    ]),
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    importPlugin.flatConfigs.recommended,
    importPlugin.flatConfigs.typescript,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname
            },
            ecmaVersion: "latest",
            sourceType: "module"
        }
    },
    {
        rules: {
            "import/no-cycle": "error",
            "import/no-unresolved": "warn",

            "@typescript-eslint/switch-exhaustiveness-check": "error",
            "@typescript-eslint/no-inferrable-types": "warn",
            "@typescript-eslint/require-array-sort-compare": "error",
            "@typescript-eslint/strict-boolean-expressions": "error",

            "@typescript-eslint/no-misused-promises": [
                "error",
                {
                    checksVoidReturn: false
                }
            ],

            // enforce ===
            eqeqeq: "error",

            // no Promise.reject()
            "no-restricted-syntax": [
                "error",
                {
                    selector: "CallExpression[callee.object.name='Promise'][callee.property.name='reject']",
                    message: "Using Promise.reject() is not allowed. Consider using Promise<Result> instead."
                }
            ],

            // naming conventions
            "@typescript-eslint/naming-convention": [
                "error",
                { selector: "enumMember", format: ["UPPER_CASE"] },
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
                { selector: "typeLike", format: ["PascalCase"] },
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
                { selector: "interface", format: ["PascalCase"], leadingUnderscore: "forbid" },
                { selector: "class", format: ["PascalCase"], leadingUnderscore: "forbid" }
            ]
        }
    }
]);
