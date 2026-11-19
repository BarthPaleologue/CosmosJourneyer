import { AST_NODE_TYPES } from "@typescript-eslint/utils";
import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.mts";

const restrictedTypeNames: ReadonlySet<string> = new Set(["Pick", "Omit"]);

/**
 * Creates the rule that forbids the `Pick` and `Omit` utility types in any type position.
 */
export default createRule({
    name: "no-pick-omit",
    meta: {
        type: "suggestion",
        docs: {
            description: "Disallow the Pick and Omit utility types; define explicit named types instead.",
        },
        schema: [],
        messages: {
            noPickOmit:
                "Do not use {{typeName}}<...>. Pick and Omit usually signal a poorly designed type: define an explicit named type instead (a consumer-side contract implemented by the producer, or your own data type with a cast at the boundary).",
        },
    },
    create(context) {
        return {
            TSTypeReference(node) {
                const typeName = getRestrictedTypeName(node);
                if (typeName === null) {
                    return;
                }

                context.report({
                    node,
                    messageId: "noPickOmit",
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
