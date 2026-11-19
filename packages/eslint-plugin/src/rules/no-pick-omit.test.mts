import { RuleTester } from "@typescript-eslint/rule-tester";

import rule from "./no-pick-omit.mts";

const ruleTester = new RuleTester();

ruleTester.run("no-pick-omit", rule, {
    valid: [
        "function foo(x: Readonly<I18n>) {}",
        "function foo(x: Array<string>) {}",
        "const value = { method: (x: Readonly<I18n>) => x };",
        "type Registrar = { registerLocales(): void };",
        "interface Lookup { getInfo(system: string): Array<string>; }",
    ],
    invalid: [
        {
            code: 'function foo(x: Pick<I18n, "registerLocales">) {}',
            errors: [{ messageId: "noPickOmit", data: { typeName: "Pick" } }],
        },
        {
            code: 'const bar = (x: Omit<I18n, "locale">) => {};',
            errors: [{ messageId: "noPickOmit", data: { typeName: "Omit" } }],
        },
        {
            code: 'type LocaleRegistrar = Pick<I18n, "registerLocales">;',
            errors: [{ messageId: "noPickOmit", data: { typeName: "Pick" } }],
        },
        {
            code: 'type Other = Omit<I18n, "locale">;',
            errors: [{ messageId: "noPickOmit", data: { typeName: "Omit" } }],
        },
        {
            code: 'type NestedAlias = Readonly<Pick<I18n, "registerLocales">>;',
            errors: [{ messageId: "noPickOmit", data: { typeName: "Pick" } }],
        },
        {
            code: 'function foo(): Pick<I18n, "registerLocales"> { throw new Error(); }',
            errors: [{ messageId: "noPickOmit", data: { typeName: "Pick" } }],
        },
        {
            code: 'function foo(): Readonly<Omit<I18n, "locale">> { throw new Error(); }',
            errors: [{ messageId: "noPickOmit", data: { typeName: "Omit" } }],
        },
        {
            code: 'type CallbackReturn = () => Pick<I18n, "registerLocales">;',
            errors: [{ messageId: "noPickOmit", data: { typeName: "Pick" } }],
        },
        {
            code: 'class Foo { readonly value: Pick<I18n, "registerLocales">; }',
            errors: [{ messageId: "noPickOmit", data: { typeName: "Pick" } }],
        },
        {
            code: 'interface Foo { readonly value: Omit<I18n, "locale">; }',
            errors: [{ messageId: "noPickOmit", data: { typeName: "Omit" } }],
        },
        {
            code: 'const value: Pick<I18n, "registerLocales"> = {} as Pick<I18n, "registerLocales">;',
            errors: [
                { messageId: "noPickOmit", data: { typeName: "Pick" } },
                { messageId: "noPickOmit", data: { typeName: "Pick" } },
            ],
        },
        {
            code: 'function foo<T extends Pick<I18n, "registerLocales">>(x: T) {}',
            errors: [{ messageId: "noPickOmit", data: { typeName: "Pick" } }],
        },
        {
            code: 'function foo(x: Readonly<Pick<I18n, "registerLocales">>) {}',
            errors: [{ messageId: "noPickOmit", data: { typeName: "Pick" } }],
        },
        {
            code: 'function foo(x: Pick<I18n, "registerLocales"> | undefined) {}',
            errors: [{ messageId: "noPickOmit", data: { typeName: "Pick" } }],
        },
        {
            code: 'function foo(x: { value: Omit<I18n, "locale"> }) {}',
            errors: [{ messageId: "noPickOmit", data: { typeName: "Omit" } }],
        },
        {
            code: 'function foo(a: Pick<I18n, "registerLocales">, b: Omit<I18n, "locale">) {}',
            errors: [
                { messageId: "noPickOmit", data: { typeName: "Pick" } },
                { messageId: "noPickOmit", data: { typeName: "Omit" } },
            ],
        },
        {
            code: 'type Factory = new (x: Omit<I18n, "locale">) => I18n;',
            errors: [{ messageId: "noPickOmit", data: { typeName: "Omit" } }],
        },
        {
            code: 'type Callback = (x: Pick<I18n, "registerLocales">) => void;',
            errors: [{ messageId: "noPickOmit", data: { typeName: "Pick" } }],
        },
        {
            code: 'function foo(x: ReadonlyArray<Readonly<Pick<I18n, "registerLocales">>>) {}',
            errors: [{ messageId: "noPickOmit", data: { typeName: "Pick" } }],
        },
    ],
});
