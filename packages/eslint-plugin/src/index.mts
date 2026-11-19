import type { TSESLint } from "@typescript-eslint/utils";

import noClassInheritance from "./rules/no-class-inheritance.mts";
import noPickOmit from "./rules/no-pick-omit.mts";
import noPromiseReject from "./rules/no-promise-reject.mts";

type RuleDefinitions = NonNullable<TSESLint.FlatConfig.Plugin["rules"]>;

type CosmosPlugin = TSESLint.FlatConfig.Plugin & {
    rules: RuleDefinitions;
    configs: {
        all: TSESLint.FlatConfig.Config;
    };
};

const rules = {
    "no-class-inheritance": noClassInheritance,
    "no-pick-omit": noPickOmit,
    "no-promise-reject": noPromiseReject,
} satisfies RuleDefinitions;

const allPlugins: TSESLint.FlatConfig.Plugins = {};

const allConfig: TSESLint.FlatConfig.Config = {
    name: "cosmos/all",
    plugins: allPlugins,
    rules: Object.fromEntries(Object.keys(rules).map((ruleName) => [`cosmos/${ruleName}`, "error"] as const)),
};

const plugin: CosmosPlugin = {
    meta: {
        name: "@cosmos-journeyer/eslint-plugin",
        version: "1.11.3",
    },
    rules,
    configs: {
        all: allConfig,
    },
};

allPlugins["cosmos"] = plugin;

export default plugin;
