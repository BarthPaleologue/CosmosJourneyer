import { RuleTester } from "@typescript-eslint/rule-tester";

import rule from "./no-string-in.mts";

const ruleTester = new RuleTester();

ruleTester.run("no-string-in", rule, {
    valid: [
        "const has = key in obj;",
        "const has = 0 in arr;",
        "if (control instanceof Button) { control.press(); }",
        "const parsed = schema.safeParse(value);",
        "const has = Object.hasOwn(obj, 'key');",
        "const type = obj.type;",
        "for (const key in obj) { console.log(key); }",
    ],
    invalid: [
        {
            code: 'if ("name" in target) { console.log(target.name); }',
            errors: [{ messageId: "noStringIn" }],
        },
        {
            code: 'const has = "connectTo" in value;',
            errors: [{ messageId: "noStringIn" }],
        },
        {
            code: 'return "storage" in navigator && "getDirectory" in navigator.storage;',
            errors: [{ messageId: "noStringIn" }, { messageId: "noStringIn" }],
        },
        {
            code: 'const segments = mirror !== null && "thinInstanceCount" in mirror ? mirror.thinInstanceCount : 0;',
            errors: [{ messageId: "noStringIn" }],
        },
    ],
});
