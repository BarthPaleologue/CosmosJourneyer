import { RuleTester } from "@typescript-eslint/rule-tester";

import rule from "./no-undefined-required-parameters.mts";

const ruleTester = new RuleTester({
    languageOptions: {
        parserOptions: {
            projectService: {
                allowDefaultProject: ["*.ts"],
            },
            tsconfigRootDir: import.meta.dirname,
        },
    },
});

ruleTester.run("no-undefined-required-parameters", rule, {
    valid: [
        "function foo(a: number): void {}",
        "function foo(a: number | string): void {}",
        "function foo(a?: number): void {}",
        "function foo(a: number, options?: { b?: string }): void {}",
        "function foo(a = 1): void {}",
        "function foo(...rest: Array<number>): void {}",
        "function foo(a: unknown): void {}",
        "function foo(a: any): void {}",
        "function foo(a: number): number | undefined { return a > 0 ? a : undefined; }",
        "type Alias = number; function foo(a: Alias): void {}",
        "type Fn = (a: number) => number | undefined;",
        "declare function external(a: number | undefined): void;",
        "const values = [1, undefined]; values.filter((value) => value !== undefined);",
        "declare const rules: Record<string, (env: unknown | undefined) => void>; rules['link_open'] = (env) => {};",
        "class Foo { method(a: number, options?: { b?: string }): void {} }",
        "class Foo { constructor(private a: number, options?: { b?: string }) {} }",
    ],
    invalid: [
        {
            code: "function foo(a: number | undefined): void {}",
            errors: [{ messageId: "noUndefinedInRequiredParameter", data: { paramName: "a" } }],
        },
        {
            code: "type MaybeNumber = number | undefined; function foo(a: MaybeNumber): void {}",
            errors: [{ messageId: "noUndefinedInRequiredParameter", data: { paramName: "a" } }],
        },
        {
            code: "function foo(a: number, b: string | undefined): void {}",
            errors: [{ messageId: "noUndefinedInRequiredParameter", data: { paramName: "b" } }],
        },
        {
            code: "const foo = (a: string | undefined) => a;",
            errors: [{ messageId: "noUndefinedInRequiredParameter", data: { paramName: "a" } }],
        },
        {
            code: "type Opts = { a: number }; function foo({ a }: Opts | undefined): void {}",
            errors: [{ messageId: "noUndefinedInRequiredParameter", data: { paramName: "destructured" } }],
        },
        {
            code: "class Foo { constructor(private a: number | undefined) {} }",
            errors: [{ messageId: "noUndefinedInRequiredParameter", data: { paramName: "a" } }],
        },
        {
            code: "class Foo { method(a: number | undefined): void {} }",
            errors: [{ messageId: "noUndefinedInRequiredParameter", data: { paramName: "a" } }],
        },
        {
            code: "interface Service { run(a: number | undefined): void }",
            errors: [{ messageId: "noUndefinedInRequiredParameter", data: { paramName: "a" } }],
        },
        {
            code: "type Callback = (a: number | undefined) => void;",
            errors: [{ messageId: "noUndefinedInRequiredParameter", data: { paramName: "a" } }],
        },
        {
            code: "type Factory = new (a: number | undefined) => Foo;",
            errors: [{ messageId: "noUndefinedInRequiredParameter", data: { paramName: "a" } }],
        },
        {
            code: "interface Service { new (a: number | undefined): Foo }",
            errors: [{ messageId: "noUndefinedInRequiredParameter", data: { paramName: "a" } }],
        },
        {
            code: "interface Service { (a: number | undefined): void }",
            errors: [{ messageId: "noUndefinedInRequiredParameter", data: { paramName: "a" } }],
        },
        {
            code: "function overloaded(a: number | undefined): void; function overloaded(a: number): void {}",
            errors: [{ messageId: "noUndefinedInRequiredParameter", data: { paramName: "a" } }],
        },
    ],
});
