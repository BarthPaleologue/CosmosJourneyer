import type { TSESLint } from "@typescript-eslint/utils";

import noClassInheritance from "./rules/no-class-inheritance.mts";
import noDefaultParameters from "./rules/no-default-parameters.mts";
import noImplicitRandom from "./rules/no-implicit-random.mts";
import noOptionalParameters from "./rules/no-optional-parameters.mts";
import noPickOmit from "./rules/no-pick-omit.mts";
import noPromiseReject from "./rules/no-promise-reject.mts";
import noStringIn from "./rules/no-string-in.mts";
import noTypeGuards from "./rules/no-type-guards.mts";
import noUndefinedRequiredParameters from "./rules/no-undefined-required-parameters.mts";

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
    "no-implicit-random": noImplicitRandom,
    "no-optional-parameters": noOptionalParameters,
    "no-pick-omit": noPickOmit,
    "no-promise-reject": noPromiseReject,
    "no-string-in": noStringIn,
    "no-type-guards": noTypeGuards,
    "no-undefined-required-parameters": noUndefinedRequiredParameters,
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
