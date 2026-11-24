import { RuleTester } from "@typescript-eslint/rule-tester";

import rule from "./no-type-guards.mts";

const ruleTester = new RuleTester();

ruleTester.run("no-type-guards", rule, {
    valid: [
        'function isString(value: unknown): boolean { return typeof value === "string"; }',
        'const isString = (value: unknown): boolean => typeof value === "string";',
        'function parse(value: unknown): string | undefined { return typeof value === "string" ? value : undefined; }',
        "const value = [1, undefined].filter((x) => x !== undefined);",
        "class Foo { isBar(value: unknown): boolean { return value instanceof Bar; } }",
        "interface Service { run(task: string): void }",
        "type Callback = (value: unknown) => boolean;",
        "declare function external(value: unknown): boolean;",
        "const schema = z.object({ name: z.string() });",
        "function check(control: unknown): void { if (control instanceof Button) { control.press(); } }",
    ],
    invalid: [
        {
            code: 'function isString(value: unknown): value is string { return typeof value === "string"; }',
            errors: [{ messageId: "noTypeGuard", data: { paramName: "value" } }],
        },
        {
            code: "const isNonEmpty = (arr: ReadonlyArray<number>): arr is [number, ...number[]] => arr.length > 0;",
            errors: [{ messageId: "noTypeGuard", data: { paramName: "arr" } }],
        },
        {
            code: "rows.filter((star): star is Star => star !== undefined);",
            errors: [{ messageId: "noTypeGuard", data: { paramName: "star" } }],
        },
        {
            code: "class Foo { isBar(value: unknown): value is Bar { return value instanceof Bar; } }",
            errors: [{ messageId: "noTypeGuard", data: { paramName: "value" } }],
        },
        {
            code: "interface Service { isReady(state: unknown): state is Ready; }",
            errors: [{ messageId: "noTypeGuard", data: { paramName: "state" } }],
        },
        {
            code: "type Guard = (value: unknown) => value is string;",
            errors: [{ messageId: "noTypeGuard", data: { paramName: "value" } }],
        },
        {
            code: "function overloaded(value: unknown): value is string; function overloaded(value: unknown): boolean { return true; }",
            errors: [{ messageId: "noTypeGuard", data: { paramName: "value" } }],
        },
    ],
});
