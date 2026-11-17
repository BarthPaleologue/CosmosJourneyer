import { RuleTester } from "@typescript-eslint/rule-tester";

import rule from "./no-class-inheritance.mts";

const ruleTester = new RuleTester();

ruleTester.run("no-class-inheritance", rule, {
    valid: [
        "class Foo {}",
        "const Foo = class {};",
        "abstract class Foo {}",
        "class Foo implements Bar {}",
        "interface Foo extends Bar {}",
        "type Foo = Bar & Baz;",
    ],
    invalid: [
        {
            code: "class Foo extends Bar {}",
            errors: [{ messageId: "noClassInheritance" }],
        },
        {
            code: "const Foo = class extends Bar {};",
            errors: [{ messageId: "noClassInheritance" }],
        },
        {
            code: "class Foo extends ns.Bar {}",
            errors: [{ messageId: "noClassInheritance" }],
        },
        {
            code: "class Foo extends getBase() {}",
            errors: [{ messageId: "noClassInheritance" }],
        },
        {
            code: "class Foo extends Bar implements Baz {}",
            errors: [{ messageId: "noClassInheritance" }],
        },
        {
            code: "class Foo extends Bar {}\nclass Baz extends Qux {}",
            errors: [{ messageId: "noClassInheritance" }, { messageId: "noClassInheritance" }],
        },
    ],
});
