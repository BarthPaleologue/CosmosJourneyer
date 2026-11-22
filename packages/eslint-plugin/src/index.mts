import type { TSESLint } from "@typescript-eslint/utils";

import noClassInheritance from "./rules/no-class-inheritance.mts";
import noDefaultParameters from "./rules/no-default-parameters.mts";
import noOptionalParameters from "./rules/no-optional-parameters.mts";
import noPickOmit from "./rules/no-pick-omit.mts";
import noPromiseReject from "./rules/no-promise-reject.mts";
import noUndefinedArguments from "./rules/no-undefined-arguments.mts";

type RuleDefinitions = NonNullable<TSESLint.FlatConfig.Plugin["rules"]>;

type CosmosPlugin = TSESLint.FlatConfig.Plugin & {
    rules: RuleDefinitions;
    configs: {
        all: TSESLint.FlatConfig.Config;
    };
};

const rules = {
    "no-class-inheritance": noClassInheritance,
    "no-default-parameters": noDefaultParameters,
    "no-optional-parameters": noOptionalParameters,
    "no-pick-omit": noPickOmit,
    "no-promise-reject": noPromiseReject,
    "no-undefined-arguments": noUndefinedArguments,
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
