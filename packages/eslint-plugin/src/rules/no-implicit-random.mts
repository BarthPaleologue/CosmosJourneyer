import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.mts";

/**
 * Creates the rule that disallows implicit randomness via `Math.random`.
 */
export default createRule({
    name: "no-implicit-random",
    meta: {
        type: "problem",
        docs: {
            description:
                "Disallow `Math.random` (called or referenced). Procedural and persistent state must draw from an explicit deterministic source such as `squirrelNoise`/`getRngFromSeed` from `@cosmos-journeyer/random`.",
        },
        schema: [],
        messages: {
            noImplicitRandom:
                "Implicit randomness via `Math.random` is not allowed. Use an explicit deterministic source: `squirrelNoise(seed, index)` or `getRngFromSeed(seed)` from `@cosmos-journeyer/random`, or pass a `(step) => number` source to the distribution helpers. Non-persistent demo code (playgrounds) is exempt via config.",
        },
    },
    create(context) {
        return {
            MemberExpression: checkNode,
        };

        /**
         * Reports any member access resolving to `Math.random`, whether called or passed as a value.
         * @param node Member expression to inspect.
         */
        function checkNode(node: TSESTree.MemberExpression): void {
            if (node.computed) {
                if (node.property.type === AST_NODE_TYPES.Literal && node.property.value === "random") {
                    context.report({ node, messageId: "noImplicitRandom" });
                }
                return;
            }

            if (
                node.object.type === AST_NODE_TYPES.Identifier &&
                node.object.name === "Math" &&
                node.property.type === AST_NODE_TYPES.Identifier &&
                node.property.name === "random"
            ) {
                context.report({ node, messageId: "noImplicitRandom" });
            }
        }
    },
});
