import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.mts";

type NodeWithParams =
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.TSConstructorType
    | TSESTree.TSConstructSignatureDeclaration
    | TSESTree.TSCallSignatureDeclaration
    | TSESTree.TSDeclareFunction
    | TSESTree.TSEmptyBodyFunctionExpression
    | TSESTree.TSFunctionType
    | TSESTree.TSMethodSignature;

/**
 * Creates the rule that allows at most one optional parameter, as a last parameter named `options`.
 */
export default createRule({
    name: "no-optional-parameters",
    meta: {
        type: "suggestion",
        docs: {
            description:
                "Disallow optional parameters except a single last parameter named `options` holding configuration knobs.",
        },
        schema: [],
        messages: {
            noOptionalParameter:
                "Optional parameters are not allowed: only a single last parameter named `options` (an options object holding configuration knobs) may be optional. Make {{paramName}} required and pass it explicitly at the call site, or move the knob into the trailing `options` object.",
        },
    },
    create(context) {
        return {
            FunctionDeclaration: checkNode,
            FunctionExpression: checkNode,
            ArrowFunctionExpression: checkNode,
            TSFunctionType: checkNode,
            TSConstructorType: checkNode,
            TSConstructSignatureDeclaration: checkNode,
            TSCallSignatureDeclaration: checkNode,
            TSEmptyBodyFunctionExpression: checkNode,
            TSMethodSignature: checkNode,
            TSDeclareFunction: checkDeclareFunction,
        };

        /**
         * Reports optional parameters on overload signatures, keeping ambient declarations exempt.
         * @param node Function declaration without a body (overload signature or ambient declaration).
         */
        function checkDeclareFunction(node: TSESTree.TSDeclareFunction): void {
            if (node.declare) {
                return;
            }
            checkNode(node);
        }

        /**
         * Reports every optional parameter that is not a last parameter named `options`.
         * @param node Function-like node to inspect.
         */
        function checkNode(node: NodeWithParams): void {
            const lastIndex = node.params.length - 1;

            node.params.forEach((param, index) => {
                if (!isOptionalParameter(param)) {
                    return;
                }
                if (index === lastIndex && isOptionsIdentifier(param)) {
                    return;
                }

                context.report({
                    node: param,
                    messageId: "noOptionalParameter",
                    data: { paramName: describeParameter(param) },
                });
            });
        }
    },
});

/**
 * Unwraps a constructor parameter property to the parameter it wraps.
 * @param param Parameter node to unwrap.
 * @returns The inner parameter for parameter properties, the node itself otherwise.
 */
function unwrapParameterProperty(param: TSESTree.Node): TSESTree.Node {
    return param.type === AST_NODE_TYPES.TSParameterProperty ? param.parameter : param;
}

/**
 * Checks whether a parameter carries the optional `?` modifier.
 * @param param Parameter node to inspect.
 * @returns Whether the parameter is optional.
 */
function isOptionalParameter(param: TSESTree.Node): boolean {
    const target = unwrapParameterProperty(param);
    return "optional" in target && target.optional === true;
}

/**
 * Checks whether a parameter is a plain identifier named `options`.
 * @param param Parameter node to inspect.
 * @returns Whether the parameter is the `options` identifier.
 */
function isOptionsIdentifier(param: TSESTree.Node): boolean {
    const target = unwrapParameterProperty(param);
    return target.type === AST_NODE_TYPES.Identifier && target.name === "options";
}

/**
 * Returns a human-readable name for a parameter in report messages.
 * @param param Parameter node to describe.
 * @returns The identifier name, or a placeholder for destructured patterns.
 */
function describeParameter(param: TSESTree.Node): string {
    const target = unwrapParameterProperty(param);
    return target.type === AST_NODE_TYPES.Identifier ? target.name : "this destructured parameter";
}
