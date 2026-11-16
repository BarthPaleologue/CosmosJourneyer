import assert from "node:assert/strict";
import { test } from "node:test";

import cosmosPlugin from "./index.mts";

void test("all preset enables every registered rule", () => {
    const registeredRuleNames = Object.keys(cosmosPlugin.rules);
    const presetRuleNames = Object.keys(cosmosPlugin.configs.all.rules ?? {});

    assert.ok(registeredRuleNames.length > 0);
    assert.deepEqual(new Set(presetRuleNames), new Set(registeredRuleNames.map((ruleName) => `cosmos/${ruleName}`)));

    for (const ruleName of registeredRuleNames) {
        assert.equal(cosmosPlugin.configs.all.rules?.[`cosmos/${ruleName}`], "error");
    }

    assert.equal(cosmosPlugin.configs.all.plugins?.["cosmos"], cosmosPlugin);
});
