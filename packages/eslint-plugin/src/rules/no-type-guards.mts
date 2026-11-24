import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.mts";

type FunctionLikeWithReturnType =
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.TSDeclareFunction
    | TSESTree.TSEmptyBodyFunctionExpression
    | TSESTree.TSFunctionType
    | TSESTree.TSCallSignatureDeclaration
    | TSESTree.TSConstructSignatureDeclaration
    | TSESTree.TSMethodSignature;

/**
 * Creates the rule that disallows written type predicates (`x is T` return types).
 */
export default createRule({
    name: "no-type-guards",
    meta: {
        type: "problem",
        docs: {
            description:
                "Disallow written type predicates (`x is T` return types). Use Zod schemas at validation boundaries, or `instanceof`/`typeof` narrowing at the use site.",
        },
        schema: [],
        messages: {
            noTypeGuard:
                "Written type guards (`{{paramName}} is T`) are not allowed. Leave the return annotation off and let tsc infer the predicate (TS 5.5+), narrow with instanceof/typeof at the use site, or validate with a Zod schema at the boundary.",
        },
    },
    create(context) {
        return {
            ArrowFunctionExpression: checkNode,
            FunctionDeclaration: checkNode,
            FunctionExpression: checkNode,
            TSDeclareFunction: checkNode,
            TSEmptyBodyFunctionExpression: checkNode,
            TSFunctionType: checkNode,
            TSCallSignatureDeclaration: checkNode,
            TSConstructSignatureDeclaration: checkNode,
            TSMethodSignature: checkNode,
        };

        /**
         * Reports the node when its return type is a type predicate.
         * @param node Function-like node to inspect.
         */
        function checkNode(node: FunctionLikeWithReturnType): void {
            const returnType = node.returnType;
            if (returnType === undefined || returnType.typeAnnotation.type !== AST_NODE_TYPES.TSTypePredicate) {
                return;
            }

            const predicate = returnType.typeAnnotation;
            context.report({
                node: predicate,
                messageId: "noTypeGuard",
                data: {
                    paramName:
                        predicate.parameterName.type === AST_NODE_TYPES.Identifier
                            ? predicate.parameterName.name
                            : "this",
                },
            });
        }
    },
});
