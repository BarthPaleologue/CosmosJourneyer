import { RuleTester } from "@typescript-eslint/rule-tester";

import rule from "./no-inline-pick-omit-parameters.mts";

const ruleTester = new RuleTester();

ruleTester.run("no-inline-pick-omit-parameters", rule, {
    valid: [
        'type LocaleRegistrar = Pick<I18n, "registerLocales">; function foo(x: LocaleRegistrar) {}',
        'type Other = Omit<I18n, "locale">; function foo(x: Other) {}',
        'type NestedAlias = Readonly<Pick<I18n, "registerLocales">>;',
        'function foo(): Pick<I18n, "registerLocales"> { throw new Error(); }',
        'function foo(): Readonly<Omit<I18n, "locale">> { throw new Error(); }',
        'type CallbackReturn = () => Pick<I18n, "registerLocales">;',
        'class Foo { readonly value: Pick<I18n, "registerLocales">; }',
        'interface Foo { readonly value: Omit<I18n, "locale">; }',
        'const value: Pick<I18n, "registerLocales"> = {} as Pick<I18n, "registerLocales">;',
        "function foo(x: Readonly<I18n>) {}",
        "function foo(x: Array<string>) {}",
        'function foo<T extends Pick<I18n, "registerLocales">>(x: T) {}',
        "const value = { method: (x: Readonly<I18n>) => x };",
    ],
    invalid: [
        {
            code: 'function foo(x: Pick<I18n, "registerLocales">) {}',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Pick" } }],
        },
        {
            code: 'const bar = (x: Omit<I18n, "locale">) => {};',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Omit" } }],
        },
        {
            code: 'const bar = function (x: Pick<I18n, "registerLocales">) {};',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Pick" } }],
        },
        {
            code: 'function baz(x: Readonly<Pick<I18n, "registerLocales">>) {}',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Pick" } }],
        },
        {
            code: 'function foo(x?: Pick<I18n, "registerLocales">) {}',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Pick" } }],
        },
        {
            code: 'function foo(x: Omit<I18n, "locale"> = undefined) {}',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Omit" } }],
        },
        {
            code: 'function foo(...x: Array<Pick<I18n, "registerLocales">>) {}',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Pick" } }],
        },
        {
            code: 'function foo({ registerLocales }: Pick<I18n, "registerLocales">) {}',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Pick" } }],
        },
        {
            code: 'function foo([registerLocales]: ReadonlyArray<Pick<I18n, "registerLocales">>) {}',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Pick" } }],
        },
        {
            code: 'function foo(x: Pick<I18n, "registerLocales"> | undefined) {}',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Pick" } }],
        },
        {
            code: 'function foo(x: Pick<I18n, "registerLocales"> & Extra) {}',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Pick" } }],
        },
        {
            code: 'function foo(x: { value: Omit<I18n, "locale"> }) {}',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Omit" } }],
        },
        {
            code: 'function foo(x: Array<Omit<I18n, "locale">>) {}',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Omit" } }],
        },
        {
            code: 'function foo(a: Pick<I18n, "registerLocales">, b: Omit<I18n, "locale">) {}',
            errors: [
                { messageId: "noInlineUtilityType", data: { typeName: "Pick" } },
                { messageId: "noInlineUtilityType", data: { typeName: "Omit" } },
            ],
        },
        {
            code: 'class Foo { method(x: Pick<I18n, "registerLocales">) {} }',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Pick" } }],
        },
        {
            code: 'class Foo { constructor(x: Omit<I18n, "locale">) {} }',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Omit" } }],
        },
        {
            code: 'class Foo { constructor(private readonly x: Pick<I18n, "registerLocales">) {} }',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Pick" } }],
        },
        {
            code: 'class Foo { method(x: Omit<I18n, "locale">): void; method(x: unknown): void {} }',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Omit" } }],
        },
        {
            code: 'function foo(x: Pick<I18n, "registerLocales">): void; function foo(x: unknown): void {}',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Pick" } }],
        },
        {
            code: 'interface Foo { method(x: Pick<I18n, "registerLocales">): void; }',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Pick" } }],
        },
        {
            code: 'interface Foo { method: (x: Omit<I18n, "locale">) => void; }',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Omit" } }],
        },
        {
            code: 'interface Foo { (x: Pick<I18n, "registerLocales">): void; }',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Pick" } }],
        },
        {
            code: 'type Factory = new (x: Omit<I18n, "locale">) => I18n;',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Omit" } }],
        },
        {
            code: 'type Callback = (x: Pick<I18n, "registerLocales">) => void;',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Pick" } }],
        },
        {
            code: 'function foo(callback: (x: Pick<I18n, "registerLocales">) => void) {}',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Pick" } }],
        },
        {
            code: 'function foo(x: ReadonlyArray<Readonly<Pick<I18n, "registerLocales">>>) {}',
            errors: [{ messageId: "noInlineUtilityType", data: { typeName: "Pick" } }],
        },
    ],
});
