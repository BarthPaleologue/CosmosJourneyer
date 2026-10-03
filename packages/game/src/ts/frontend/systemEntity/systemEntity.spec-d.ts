import type { DeepReadonly, Result } from "@cosmos-journeyer/typescript";
import { expectTypeOf, test } from "vitest";

import type { SystemContentModel, SystemEntityModel } from "@/backend/systemEntity/systemEntityModel";

import type { DarkKnight } from "@/modules/darkKnight/darkKnight";
import type { DarkKnightModel } from "@/modules/darkKnight/darkKnightModel";

import type {
    ContentModelOf,
    ContentOf,
    SystemContent,
    SystemContentFactoryContext,
    SystemContentFactoryOf,
    SystemContentType,
    SystemEntity,
} from "./systemEntity";

type TestDarkKnightType = SystemContentType<DarkKnightModel, DarkKnight>;

test("content types retain their associated model and runtime content", () => {
    expectTypeOf<ContentModelOf<TestDarkKnightType>>().toEqualTypeOf<DarkKnightModel>();
    expectTypeOf<ContentOf<TestDarkKnightType>>().toEqualTypeOf<DarkKnight>();
});

test("entities retain their content type and readonly model", () => {
    expectTypeOf<SystemEntity<TestDarkKnightType>["content"]>().toEqualTypeOf<DarkKnight>();
    expectTypeOf<SystemEntity<TestDarkKnightType>["model"]>().toEqualTypeOf<
        DeepReadonly<SystemEntityModel<DarkKnightModel>>
    >();
});

test("factories accept the associated readonly model and return the associated content", () => {
    expectTypeOf<SystemContentFactoryOf<TestDarkKnightType>>().toEqualTypeOf<
        (model: DeepReadonly<DarkKnightModel>, context: SystemContentFactoryContext) => Result<DarkKnight, Error>
    >();
});

type OtherModel = SystemContentModel<"other">;

interface OtherContent extends SystemContent {
    readonly otherProperty: true;
}

type OtherType = SystemContentType<OtherModel, OtherContent>;

declare const darkKnightEntity: SystemEntity<TestDarkKnightType>;

test("entities with different content types are not interchangeable", () => {
    // @ts-expect-error Different SystemContent types must not be interchangeable.
    const wrongEntity: SystemEntity<OtherType> = darkKnightEntity;
    expectTypeOf(wrongEntity).toEqualTypeOf<SystemEntity<OtherType>>();
});
