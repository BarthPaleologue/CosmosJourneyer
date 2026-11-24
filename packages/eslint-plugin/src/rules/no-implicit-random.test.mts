import { RuleTester } from "@typescript-eslint/rule-tester";

import rule from "./no-implicit-random.mts";

const ruleTester = new RuleTester();

ruleTester.run("no-implicit-random", rule, {
    valid: [
        "const value = squirrelNoise(seed, 0);",
        "const rng = getRngFromSeed(42); const value = rng(0);",
        "const rand = (step) => 0.5; const value = randRange(0, 1, rand, 0);",
        "const value = Math.floor(x);",
        "const pi = Math.PI;",
        "const { floor } = Math; const value = floor(x);",
        "const random = () => 0.5; const value = random();",
    ],
    invalid: [
        {
            code: "const value = Math.random();",
            errors: [{ messageId: "noImplicitRandom" }],
        },
        {
            code: "const value = randRange(0, 1, Math.random, 0);",
            errors: [{ messageId: "noImplicitRandom" }],
        },
        {
            code: "const v = new Vector3(Math.random(), Math.random(), Math.random());",
            errors: [
                { messageId: "noImplicitRandom" },
                { messageId: "noImplicitRandom" },
                { messageId: "noImplicitRandom" },
            ],
        },
        {
            code: "const value = Math['random']();",
            errors: [{ messageId: "noImplicitRandom" }],
        },
        {
            code: "const seed = Number(urlParams.get('seed') ?? Math.random() * 100_000);",
            errors: [{ messageId: "noImplicitRandom" }],
        },
    ],
});
