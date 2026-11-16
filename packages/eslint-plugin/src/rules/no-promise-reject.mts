import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.mts";

/**
 * Creates the rule that forbids calling `Promise.reject()`.
 */
export default createRule({
    name: "no-promise-reject",
    meta: {
        type: "problem",
        docs: {
            description: "Disallow calls to Promise.reject().",
        },
        schema: [],
        messages: {
            noPromiseReject: "Using Promise.reject() is not allowed. Consider using Promise<Result> instead.",
        },
    },
    create(context) {
        return {
            CallExpression(node) {
                if (!isPromiseRejectCall(node)) {
                    return;
                }

                context.report({ node, messageId: "noPromiseReject" });
            },
        };
    },
});

/**
 * Checks whether a call expression statically names `Promise.reject`.
 * @param node Call expression to inspect.
 * @returns Whether the callee is a non-computed `Promise.reject` member expression.
 */
function isPromiseRejectCall(node: Readonly<TSESTree.CallExpression>): boolean {
    const callee = node.callee;

    return (
        callee.type === AST_NODE_TYPES.MemberExpression &&
        !callee.computed &&
        callee.object.type === AST_NODE_TYPES.Identifier &&
        callee.object.name === "Promise" &&
        callee.property.type === AST_NODE_TYPES.Identifier &&
        callee.property.name === "reject"
    );
}
