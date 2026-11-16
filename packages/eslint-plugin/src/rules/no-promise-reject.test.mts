import { RuleTester } from "@typescript-eslint/rule-tester";

import rule from "./no-promise-reject.mts";

const ruleTester = new RuleTester();

ruleTester.run("no-promise-reject", rule, {
    valid: [
        "Promise.resolve(1);",
        "const promise = { reject: () => undefined }; promise.reject();",
        "Object.reject();",
        "Promise.reject;",
        "Promise?.resolve();",
        "new Promise((resolve) => resolve());",
        "globalThis.Promise.reject();",
        "foo.Promise.reject();",
        'Promise["reject"](new Error("not a static member name"));',
        "Promise.reject.call(Promise, new Error('not a direct call'));",
    ],
    invalid: [
        {
            code: "Promise.reject();",
            errors: [{ messageId: "noPromiseReject" }],
        },
        {
            code: 'Promise.reject(new Error("nope"));',
            errors: [{ messageId: "noPromiseReject" }],
        },
        {
            code: "Promise?.reject();",
            errors: [{ messageId: "noPromiseReject" }],
        },
        {
            code: "Promise.reject?.();",
            errors: [{ messageId: "noPromiseReject" }],
        },
        {
            code: "Promise?.reject?.(new Error('nope'));",
            errors: [{ messageId: "noPromiseReject" }],
        },
        {
            code: "(Promise).reject();",
            errors: [{ messageId: "noPromiseReject" }],
        },
        {
            code: "Promise.reject(); Promise.reject();",
            errors: [{ messageId: "noPromiseReject" }, { messageId: "noPromiseReject" }],
        },
    ],
});
