import type { TSESTree } from "@typescript-eslint/utils";

import { createRule } from "../utils/create-rule.mts";

type NoClassInheritanceMessageIds = "noClassInheritance";

/**
 * Creates the rule that forbids class inheritance via `extends`.
 */
export default createRule<[], NoClassInheritanceMessageIds>({
    name: "no-class-inheritance",
    meta: {
        type: "problem",
        docs: {
            description: "Disallow class inheritance via `extends`. Prefer composition over inheritance.",
        },
        schema: [],
        messages: {
            noClassInheritance:
                "Class inheritance via 'extends' is not allowed. Compose instead: hold an instance of the wrapped class in a private field and expose it through a getter (e.g. `get()`), or return it directly from a factory function.",
        },
    },
    create(context) {
        return {
            ClassDeclaration: checkClass,
            ClassExpression: checkClass,
        };

        /**
         * Reports a class declaration or expression that declares a superclass.
         * @param node Class node to inspect.
         */
        function checkClass(node: TSESTree.ClassDeclaration | TSESTree.ClassExpression): void {
            if (node.superClass === null) {
                return;
            }

            context.report({ node: node.superClass, messageId: "noClassInheritance" });
        }
    },
});
