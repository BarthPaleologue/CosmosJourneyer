import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.mts";

/**
 * Creates the rule that disallows passing `undefined` explicitly as a call argument or option value.
 */
export default createRule({
    name: "no-undefined-arguments",
    meta: {
        type: "suggestion",
        docs: {
            description:
                "Disallow passing `undefined` (or `void 0`) explicitly as a call argument or as a value inside an argument object; omit the argument instead.",
        },
        schema: [],
        messages: {
            noUndefinedArgument:
                "Passing `undefined` explicitly is not allowed: omit the argument or the option instead of transmitting an explicit `undefined`.",
        },
    },
    create(context) {
        return {
            CallExpression: checkArguments,
            NewExpression: checkArguments,
        };

        /**
         * Checks every argument of a call or construction.
         * @param node Call or new expression to inspect.
         */
        function checkArguments(node: TSESTree.CallExpression | TSESTree.NewExpression): void {
            for (const argument of node.arguments) {
                checkArgumentExpression(argument);
            }
        }

        /**
         * Reports explicit `undefined` values in an argument, including object literal properties.
         * @param expression Argument expression to inspect.
         */
        function checkArgumentExpression(expression: TSESTree.Node): void {
            if (isUndefinedExpression(expression)) {
                report(expression);
                return;
            }
            if (expression.type === AST_NODE_TYPES.ObjectExpression) {
                for (const property of expression.properties) {
                    if (property.type === AST_NODE_TYPES.Property && !property.computed) {
                        checkArgumentExpression(property.value);
                    }
                }
            }
        }

        /**
         * Reports a node as an explicit `undefined` argument.
         * @param node Node to report.
         */
        function report(node: TSESTree.Node): void {
            context.report({ node, messageId: "noUndefinedArgument" });
        }
    },
});

/**
 * Checks whether an expression is the literal `undefined` value, written directly or as `void 0`.
 * @param node Expression to inspect.
 * @returns Whether the expression evaluates to `undefined` by construction.
 */
function isUndefinedExpression(node: TSESTree.Node): boolean {
    if (node.type === AST_NODE_TYPES.Identifier) {
        return node.name === "undefined";
    }
    return (
        node.type === AST_NODE_TYPES.UnaryExpression &&
        node.operator === "void" &&
        node.argument.type === AST_NODE_TYPES.Literal &&
        node.argument.value === 0
    );
}
