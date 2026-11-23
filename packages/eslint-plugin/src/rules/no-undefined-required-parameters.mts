import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";
import type * as ts from "typescript";

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
 * Creates the rule that disallows `T | undefined` on required parameters.
 */
export default createRule({
    name: "no-undefined-required-parameters",
    meta: {
        type: "problem",
        docs: {
            description:
                "Disallow required parameters whose explicitly annotated type includes `undefined`; such parameters recreate a hidden default and are covered by the optional-parameter policy. Annotations are resolved through the type checker, so aliases of `T | undefined` are caught, while parameters whose type is only inferred or imposed by an external contextual signature are left alone.",
        },
        schema: [],
        messages: {
            noUndefinedInRequiredParameter:
                "Required parameter '{{paramName}}' has a type that includes `undefined`. Pass a defined value, or move the knob into a trailing optional `options` object.",
        },
    },
    create(context) {
        const services = ESLintUtils.getParserServices(context);
        const checker = services.program.getTypeChecker();
        const undefinedType = checker.getUndefinedType();

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
         * Reports required parameters whose type includes `undefined`, keeping ambient declarations exempt.
         * @param node Function declaration without a body (overload signature or ambient declaration).
         */
        function checkDeclareFunction(node: TSESTree.TSDeclareFunction): void {
            if (node.declare) {
                return;
            }
            checkNode(node);
        }

        /**
         * Reports every required parameter whose annotated type includes `undefined`.
         * Only explicit type annotations are checked: parameters whose type is inferred
         * or imposed by an external contextual signature (e.g. renderer callbacks) are exempt.
         * @param node Function-like node to inspect.
         */
        function checkNode(node: NodeWithParams): void {
            for (const param of node.params) {
                const target = unwrapParameterProperty(param);
                if (isOptionalOrDefaulted(target) || !hasExplicitTypeAnnotation(target)) {
                    continue;
                }
                const type = checker.getTypeAtLocation(services.esTreeNodeToTSNodeMap.get(target));
                if (typeIncludesUndefined(type, undefinedType)) {
                    context.report({
                        node: param,
                        messageId: "noUndefinedInRequiredParameter",
                        data: { paramName: describeParameter(param) },
                    });
                }
            }
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
 * Checks whether a parameter carries an explicit type annotation written by the author.
 * @param param Parameter node to inspect.
 * @returns Whether the parameter has a `typeAnnotation` node.
 */
function hasExplicitTypeAnnotation(param: TSESTree.Node): boolean {
    return "typeAnnotation" in param && param.typeAnnotation !== undefined;
}

/**
 * Checks whether a parameter is optional (`?`) or has a default value, and is therefore not a required parameter.
 * @param param Parameter node to inspect.
 * @returns Whether the parameter may be omitted at the call site.
 */
function isOptionalOrDefaulted(param: TSESTree.Node): boolean {
    return (
        ("optional" in param && param.optional === true) ||
        param.type === AST_NODE_TYPES.AssignmentPattern ||
        param.type === AST_NODE_TYPES.RestElement
    );
}

/**
 * Checks whether a type includes `undefined`, looking through unions and type aliases.
 * @param type Type to inspect.
 * @param undefinedType The checker's singleton `undefined` type, used for comparison.
 * @returns Whether `undefined` is part of the type.
 */
function typeIncludesUndefined(type: ts.Type, undefinedType: ts.Type): boolean {
    if (type === undefinedType) {
        return true;
    }
    return type.isUnion() && type.types.some((part) => typeIncludesUndefined(part, undefinedType));
}

/**
 * Returns a human-readable name for a parameter in report messages.
 * @param param Parameter node to describe.
 * @returns The identifier name, or a placeholder for destructured patterns.
 */
function describeParameter(param: TSESTree.Node): string {
    const target = unwrapParameterProperty(param);
    return target.type === AST_NODE_TYPES.Identifier ? target.name : "destructured";
}
