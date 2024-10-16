module.exports = {
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json",
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": [
    "@typescript-eslint"
  ],
  "rules": {
    "import/no-cycle": "error",
    "import/no-unresolved": "warn",
    "@typescript-eslint/switch-exhaustiveness-check": "error",
    "@typescript-eslint/no-inferrable-types": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "eqeqeq": "error",
    "no-restricted-syntax": [
      "error",
      {
        "selector": "TSEnumDeclaration:not([const=true])",
        "message": "Don't declare non-const enums"
      }
    ],
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "enumMember",
        "format": [
          "UPPER_CASE"
        ]
      },
      {
        "selector": "memberLike",
        "modifiers": [
          "public",
          "static"
        ],
        "format": [
          "PascalCase",
          "UPPER_CASE"
        ],
        "leadingUnderscore": "forbid"
      },
      {
        "selector": "memberLike",
        "modifiers": [
          "private",
          "static"
        ],
        "format": [
          "PascalCase",
          "UPPER_CASE"
        ],
        "leadingUnderscore": "forbid"
      },
      {
        "selector": "typeLike",
        "format": [
          "PascalCase"
        ]
      },
      {
        "selector": "variable",
        "modifiers": [
          "exported",
          "const",
          "global"
        ],
        "format": [
          "PascalCase"
        ],
        "leadingUnderscore": "forbid"
      },
      {
        "selector": "function",
        "format": [
          "camelCase",
          "snake_case"
        ],
        "leadingUnderscore": "forbid"
      },
      {
        "selector": "function",
        "modifiers": [
          "exported",
          "global"
        ],
        "format": [
          "camelCase"
        ],
        "leadingUnderscore": "forbid"
      },
      {
        "selector": "interface",
        "format": [
          "PascalCase"
        ],
        "leadingUnderscore": "forbid"
      },
      {
        "selector": "class",
        "format": [
          "PascalCase"
        ],
        "leadingUnderscore": "forbid"
      }
    ]
  }
};
