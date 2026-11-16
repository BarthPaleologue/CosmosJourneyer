import { AST_NODE_TYPES, ASTUtils } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.mts";

const restrictedTypeNames: ReadonlySet<string> = new Set(["Pick", "Omit"]);

const parameterNodeTypes: ReadonlySet<AST_NODE_TYPES> = new Set([
    AST_NODE_TYPES.Identifier,
    AST_NODE_TYPES.ObjectPattern,
    AST_NODE_TYPES.ArrayPattern,
    AST_NODE_TYPES.RestElement,
    AST_NODE_TYPES.AssignmentPattern,
    AST_NODE_TYPES.TSParameterProperty,
]);

const parameterWrapperNodeTypes: ReadonlySet<AST_NODE_TYPES> = new Set([
    AST_NODE_TYPES.RestElement,
    AST_NODE_TYPES.AssignmentPattern,
    AST_NODE_TYPES.TSParameterProperty,
]);

/**
 * Creates the rule that forbids inline `Pick` and `Omit` utility types in function parameter annotations.
 */
export default createRule({
    name: "no-inline-pick-omit-parameters",
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow inline Pick and Omit utility types in function parameter type annotations.",
        },
        schema: [],
        messages: {
            noInlineUtilityType:
                "Avoid using {{typeName}}<...> directly in a function parameter type annotation. Extract a named type alias instead.",
        },
    },
    create(context) {
        return {
            TSTypeReference(node) {
                const typeName = getRestrictedTypeName(node);
                if (typeName === null || !isInFunctionParameterTypeAnnotation(node)) {
                    return;
                }

                context.report({
                    node,
                    messageId: "noInlineUtilityType",
                    data: { typeName },
                });
            },
        };
    },
});

/**
 * Returns the restricted utility type name when a type reference names `Pick` or `Omit`.
 * @param node Type reference to inspect.
 * @returns The utility type name, or `null` for unrelated references.
 */
function getRestrictedTypeName(node: Readonly<TSESTree.TSTypeReference>): string | null {
    const typeName = node.typeName;
    if (typeName.type !== AST_NODE_TYPES.Identifier || !restrictedTypeNames.has(typeName.name)) {
        return null;
    }

    return typeName.name;
}

/**
 * Determines whether a node is nested inside a function parameter's type annotation.
 *
 * The walk stops at type aliases and function return annotations so that aliases and
 * return types remain valid homes for `Pick` and `Omit`.
 * @param node Type reference to inspect.
 * @returns Whether the reference belongs to a function parameter annotation.
 */
function isInFunctionParameterTypeAnnotation(node: Readonly<TSESTree.Node>): boolean {
    let current: TSESTree.Node = node;

    while (current.type !== AST_NODE_TYPES.Program) {
        const parent = current.parent;

        if (parent.type === AST_NODE_TYPES.TSTypeAnnotation && parent.typeAnnotation === current) {
            if (isFunctionParameterAnnotation(parent)) {
                return true;
            }

            if (isFunctionReturnTypeAnnotation(parent)) {
                return false;
            }
        }

        if (parent.type === AST_NODE_TYPES.TSTypeAliasDeclaration) {
            return false;
        }

        current = parent;
    }

    return false;
}

/**
 * Checks whether a type annotation belongs to a function parameter.
 * @param annotation Type annotation to inspect.
 * @returns Whether the annotation is attached to a parameter of a function or function type.
 */
function isFunctionParameterAnnotation(annotation: Readonly<TSESTree.TSTypeAnnotation>): boolean {
    let parameter: TSESTree.Node = annotation.parent;

    if (!parameterNodeTypes.has(parameter.type)) {
        return false;
    }

    while (parameter.parent !== undefined && parameterWrapperNodeTypes.has(parameter.parent.type)) {
        parameter = parameter.parent;
    }

    const owner = parameter.parent;
    return (
        owner !== undefined &&
        ASTUtils.isFunctionOrFunctionType(owner) &&
        owner.params.some((candidate) => candidate === parameter)
    );
}

/**
 * Checks whether a type annotation is the return type of a function or function type.
 * @param annotation Type annotation to inspect.
 * @returns Whether the annotation belongs to a function return type.
 */
function isFunctionReturnTypeAnnotation(annotation: Readonly<TSESTree.TSTypeAnnotation>): boolean {
    const parent = annotation.parent;
    return ASTUtils.isFunctionOrFunctionType(parent) && parent.returnType === annotation;
}
