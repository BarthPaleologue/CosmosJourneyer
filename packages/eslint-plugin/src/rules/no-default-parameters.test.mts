import { RuleTester } from "@typescript-eslint/rule-tester";

import rule from "./no-default-parameters.mts";

const ruleTester = new RuleTester();

ruleTester.run("no-default-parameters", rule, {
    valid: [
        "function foo(x: number) {}",
        "function foo(x?: number) {}",
        "const foo = (x: number) => x;",
        "const foo = (x?: number) => x;",
        "function foo({ a, b }: Options) {}",
        "function foo([a, b]: Array<number>) {}",
        "function foo(...rest: Array<number>) {}",
        "function foo(callback: (x: number) => void) {}",
        "type Callback = (x: number) => void;",
        "interface Service { run(task: string): void }",
        "class Foo { constructor(private x: number) {} }",
        "class Foo { method(x: number) {} }",
        "class Foo { set value(x: number) {} }",
        "const obj = { method(x: number) {} };",
        // Fallbacks resolved in the body are allowed, not only in signatures.
        "function foo(options?: Options) { const quality = options?.quality ?? 2; }",
        // Destructuring defaults in variable declarations are not parameter defaults.
        "const { a = 1 } = obj;",
        "function foo() { const { a = 1 } = obj; return a; }",
        "function foo() { let [x = 2] = arr; return x; }",
        "for (const { a = 1 } of list) {}",
        // Nested functions without defaults are fine.
        "function foo() { return (x: number) => x; }",
    ],
    invalid: [
        {
            code: "function foo(x = 1) {}",
            errors: [{ messageId: "noDefaultParameter" }],
        },
        {
            code: "function foo(x: number = 1) {}",
            errors: [{ messageId: "noDefaultParameter" }],
        },
        {
            code: "const foo = (x = 1) => x;",
            errors: [{ messageId: "noDefaultParameter" }],
        },
        {
            code: "function foo(a: string, b = 2) {}",
            errors: [{ messageId: "noDefaultParameter" }],
        },
        {
            code: "function foo(a = 1, b = 2) {}",
            errors: [{ messageId: "noDefaultParameter" }, { messageId: "noDefaultParameter" }],
        },
        {
            code: "function foo({ a = 1 }: Options) {}",
            errors: [{ messageId: "noDefaultParameter" }],
        },
        {
            code: "function foo({ a } = {}) {}",
            errors: [{ messageId: "noDefaultParameter" }],
        },
        {
            code: "function foo([a = 1]: Array<number>) {}",
            errors: [{ messageId: "noDefaultParameter" }],
        },
        {
            code: "const foo = ({ a = 1 }: Options) => a;",
            errors: [{ messageId: "noDefaultParameter" }],
        },
        {
            code: "class Foo { constructor(private x = 5) {} }",
            errors: [{ messageId: "noDefaultParameter" }],
        },
        {
            code: "class Foo { method(x = 1) {} }",
            errors: [{ messageId: "noDefaultParameter" }],
        },
        {
            code: "class Foo { set value(x = 1) {} }",
            errors: [{ messageId: "noDefaultParameter" }],
        },
        {
            code: "const obj = { method(x = 1) {} };",
            errors: [{ messageId: "noDefaultParameter" }],
        },
        {
            code: "array.map((item = 0) => item);",
            errors: [{ messageId: "noDefaultParameter" }],
        },
        {
            // The default of the outer parameter and the default of the nested callback are both reported.
            code: "function foo(cb = (x = 1) => x) {}",
            errors: [{ messageId: "noDefaultParameter" }, { messageId: "noDefaultParameter" }],
        },
        {
            code: "type F = (x = 1) => void;",
            errors: [{ messageId: "noDefaultParameter" }],
        },
        {
            code: "interface I { m(x = 1): void }",
            errors: [{ messageId: "noDefaultParameter" }],
        },
        {
            code: "type C = new (x = 1) => Foo;",
            errors: [{ messageId: "noDefaultParameter" }],
        },
        {
            code: "declare function foo(x = 1): void;",
            errors: [{ messageId: "noDefaultParameter" }],
        },
    ],
});
