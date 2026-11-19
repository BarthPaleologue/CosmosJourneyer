import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.mts";

type NodeWithParams =
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression
    | TSESTree.TSConstructorType
    | TSESTree.TSConstructSignatureDeclaration
    | TSESTree.TSDeclareFunction
    | TSESTree.TSFunctionType
    | TSESTree.TSMethodSignature;

/**
 * Creates the rule that forbids default values in function parameters.
 */
export default createRule({
    name: "no-default-parameters",
    meta: {
        type: "suggestion",
        docs: {
            description:
                "Disallow default values in function parameters; constitutive arguments must be passed explicitly at the call site.",
        },
        schema: [],
        messages: {
            noDefaultParameter:
                "Default parameter values are not allowed: a default hides a decision at the call site. Pass the argument explicitly, or resolve the fallback inside the function body (e.g. `const quality = options?.quality ?? DEFAULT_QUALITY;`).",
        },
    },
    create(context) {
        return {
            FunctionDeclaration: checkNode,
            FunctionExpression: checkNode,
            ArrowFunctionExpression: checkNode,
            TSDeclareFunction: checkNode,
            TSFunctionType: checkNode,
            TSConstructorType: checkNode,
            TSConstructSignatureDeclaration: checkNode,
            TSMethodSignature: checkNode,
        };

        /**
         * Reports every default value found in the parameter list of a function-like node.
         * @param node Function-like node to inspect.
         */
        function checkNode(node: NodeWithParams): void {
            for (const param of node.params) {
                for (const assignment of collectAssignmentPatterns(param)) {
                    context.report({ node: assignment, messageId: "noDefaultParameter" });
                }
            }
        }
    },
});

/**
 * Collects the assignment patterns of a parameter pattern, i.e. every `= value` default it contains.
 * Default value expressions are not traversed: a nested function inside a default is visited on its own.
 * @param pattern Parameter pattern to inspect.
 * @returns The assignment patterns found in the pattern, in source order.
 */
function collectAssignmentPatterns(pattern: TSESTree.Node): TSESTree.AssignmentPattern[] {
    const found: TSESTree.AssignmentPattern[] = [];
    visit(pattern);
    return found;

    /**
     * Walks a parameter pattern and collects its assignment patterns. Default value expressions are
     * not entered: a nested function inside a default is visited through its own function-like node.
     * @param node Pattern node to visit.
     */
    function visit(node: TSESTree.Node): void {
        if (node.type === AST_NODE_TYPES.AssignmentPattern) {
            found.push(node);
            visit(node.left);
            return;
        }
        if (node.type === AST_NODE_TYPES.ObjectPattern) {
            for (const property of node.properties) {
                visit(property.type === AST_NODE_TYPES.Property ? property.value : property.argument);
            }
            return;
        }
        if (node.type === AST_NODE_TYPES.ArrayPattern) {
            for (const element of node.elements) {
                if (element !== null) {
                    visit(element);
                }
            }
            return;
        }
        if (node.type === AST_NODE_TYPES.RestElement) {
            visit(node.argument);
            return;
        }
        if (node.type === AST_NODE_TYPES.TSParameterProperty) {
            visit(node.parameter);
        }
    }
}
