import { RuleTester } from "@typescript-eslint/rule-tester";

import rule from "./no-optional-parameters.mts";

const ruleTester = new RuleTester();

ruleTester.run("no-optional-parameters", rule, {
    valid: [
        "function foo(a: number) {}",
        "function foo(options?: Options) {}",
        "function foo(a: number, options?: Options) {}",
        "function foo(a: number, options: Options) {}",
        "const foo = (options?: Options) => {};",
        "const foo = (a: number, options?: Options) => {};",
        "function foo(...rest: Array<number>) {}",
        "function foo(this: Foo, options?: Options) {}",
        "class Foo { method(a: number, options?: Options) {} }",
        "class Foo { constructor(a: number, options?: Options) {} }",
        "class Foo { constructor(private a: number, options?: Options) {} }",
        "class Foo { set value(v: number) {} }",
        "const obj = { method(a: number, options?: Options) {} };",
        "interface Service { run(task: string, options?: Options): void }",
        "interface Fn { (task: string, options?: Options): void }",
        "type Callback = (options?: Options) => void;",
        "type Factory = new (a: number, options?: Options) => Foo;",
        "declare function external(a?: number): void;",
        "function overloaded(task: string, options?: Options): void; function overloaded(task: string, options: Options): void {}",
        "abstract class Foo { abstract method(task: string, options?: Options): void }",
    ],
    invalid: [
        {
            code: "function foo(a?: number) {}",
            errors: [{ messageId: "noOptionalParameter", data: { paramName: "a" } }],
        },
        {
            code: "function foo(a: number, b?: number) {}",
            errors: [{ messageId: "noOptionalParameter", data: { paramName: "b" } }],
        },
        {
            code: "function foo(a?: number, options?: Options) {}",
            errors: [{ messageId: "noOptionalParameter", data: { paramName: "a" } }],
        },
        {
            code: "function foo(a: number, lookups?: Lookups) {}",
            errors: [{ messageId: "noOptionalParameter", data: { paramName: "lookups" } }],
        },
        {
            code: "const foo = ({ a }?: Options) => {};",
            errors: [{ messageId: "noOptionalParameter", data: { paramName: "this destructured parameter" } }],
        },
        {
            code: "function foo(a: number, { b }?: Options) {}",
            errors: [{ messageId: "noOptionalParameter", data: { paramName: "this destructured parameter" } }],
        },
        {
            code: "const foo = (a?: number) => a;",
            errors: [{ messageId: "noOptionalParameter", data: { paramName: "a" } }],
        },
        {
            code: "class Foo { method(a?: number) {} }",
            errors: [{ messageId: "noOptionalParameter", data: { paramName: "a" } }],
        },
        {
            code: "class Foo { constructor(a: number, b?: number) {} }",
            errors: [{ messageId: "noOptionalParameter", data: { paramName: "b" } }],
        },
        {
            code: "const obj = { method(signal?: AbortSignal) {} };",
            errors: [{ messageId: "noOptionalParameter", data: { paramName: "signal" } }],
        },
        {
            code: "interface Service { query(adql: string, signal?: AbortSignal): void }",
            errors: [{ messageId: "noOptionalParameter", data: { paramName: "signal" } }],
        },
        {
            code: "interface Fn { (x?: number): void }",
            errors: [{ messageId: "noOptionalParameter", data: { paramName: "x" } }],
        },
        {
            code: "function overloaded(x?: number): void; function overloaded(x: number): void {}",
            errors: [{ messageId: "noOptionalParameter", data: { paramName: "x" } }],
        },
        {
            code: "abstract class Foo { abstract method(x?: number): void }",
            errors: [{ messageId: "noOptionalParameter", data: { paramName: "x" } }],
        },
        {
            code: "class Foo { method(x?: number): void; method(x: number): void {} }",
            errors: [{ messageId: "noOptionalParameter", data: { paramName: "x" } }],
        },
        {
            code: "type Callback = (x?: number) => void;",
            errors: [{ messageId: "noOptionalParameter", data: { paramName: "x" } }],
        },
        {
            code: "type Factory = new (x?: number) => Foo;",
            errors: [{ messageId: "noOptionalParameter", data: { paramName: "x" } }],
        },
        {
            code: "array.map((item?: Item) => item);",
            errors: [{ messageId: "noOptionalParameter", data: { paramName: "item" } }],
        },
        {
            code: "function foo(a?: number, b?: string) {}",
            errors: [
                { messageId: "noOptionalParameter", data: { paramName: "a" } },
                { messageId: "noOptionalParameter", data: { paramName: "b" } },
            ],
        },
    ],
});
