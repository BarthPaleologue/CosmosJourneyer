import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.mts";

/**
 * Creates the rule that disallows `"key" in object` checks with a string literal.
 */
export default createRule({
    name: "no-string-in",
    meta: {
        type: "problem",
        docs: {
            description:
                'Disallow string-literal `in` checks (`"key" in obj`). Use a Zod schema at validation boundaries, a discriminant check, or `instanceof`/`typeof` narrowing instead.',
        },
        schema: [],
        messages: {
            noStringIn:
                "String-literal `in` checks are not allowed. Validate untrusted data with a Zod schema at the boundary, narrow with a discriminant check or instanceof/typeof, or use Object.hasOwn for own-property feature detection.",
        },
    },
    create(context) {
        return {
            BinaryExpression: checkNode,
        };

        /**
         * Reports the expression when it is an `in` check with a string-literal key.
         * @param node Binary expression to inspect.
         */
        function checkNode(node: TSESTree.BinaryExpression): void {
            if (node.operator !== "in") {
                return;
            }

            const left = node.left;
            if (left.type === AST_NODE_TYPES.Literal && typeof left.value === "string") {
                context.report({ node: left, messageId: "noStringIn" });
            }
        }
    },
});
