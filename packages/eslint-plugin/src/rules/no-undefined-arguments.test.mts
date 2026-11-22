import { RuleTester } from "@typescript-eslint/rule-tester";

import rule from "./no-undefined-arguments.mts";

const ruleTester = new RuleTester();

ruleTester.run("no-undefined-arguments", rule, {
    valid: [
        "foo();",
        "foo(1, 2);",
        "foo({ a: 1, b: 2 });",
        "foo({ a: { b: 1 } });",
        "new Foo(1);",
        "const x = undefined; foo(x);",
        "function f(): undefined { return undefined; }",
        "foo(...args);",
        "foo({ ...spread });",
        "const y = void 0; foo(y);",
    ],
    invalid: [
        {
            code: "foo(undefined);",
            errors: [{ messageId: "noUndefinedArgument" }],
        },
        {
            code: "foo(1, undefined);",
            errors: [{ messageId: "noUndefinedArgument" }],
        },
        {
            code: "foo(void 0);",
            errors: [{ messageId: "noUndefinedArgument" }],
        },
        {
            code: "new Foo(undefined);",
            errors: [{ messageId: "noUndefinedArgument" }],
        },
        {
            code: "foo({ a: undefined });",
            errors: [{ messageId: "noUndefinedArgument" }],
        },
        {
            code: "foo({ a: { b: undefined } });",
            errors: [{ messageId: "noUndefinedArgument" }],
        },
        {
            code: "foo(1, { a: undefined }, 3);",
            errors: [{ messageId: "noUndefinedArgument" }],
        },
        {
            code: "foo(undefined, void 0);",
            errors: [{ messageId: "noUndefinedArgument" }, { messageId: "noUndefinedArgument" }],
        },
    ],
});
