import type { Assert, DeepReadonly, Result, StrictEqual } from "@cosmos-journeyer/typescript";

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

export type DarkKnightContentModelIsCorrect = Assert<StrictEqual<ContentModelOf<TestDarkKnightType>, DarkKnightModel>>;

export type DarkKnightContentIsCorrect = Assert<StrictEqual<ContentOf<TestDarkKnightType>, DarkKnight>>;

export type DarkKnightEntityContentIsCorrect = Assert<
    StrictEqual<SystemEntity<TestDarkKnightType>["content"], DarkKnight>
>;

export type DarkKnightEntityModelIsCorrect = Assert<
    StrictEqual<SystemEntity<TestDarkKnightType>["model"], DeepReadonly<SystemEntityModel<DarkKnightModel>>>
>;

export type DarkKnightFactoryIsCorrect = Assert<
    StrictEqual<
        SystemContentFactoryOf<TestDarkKnightType>,
        (model: DeepReadonly<DarkKnightModel>, context: SystemContentFactoryContext) => Result<DarkKnight, Error>
    >
>;

type OtherModel = SystemContentModel<"other">;

interface OtherContent extends SystemContent {
    readonly otherProperty: true;
}

type OtherType = SystemContentType<OtherModel, OtherContent>;

declare const darkKnightEntity: SystemEntity<TestDarkKnightType>;

// @ts-expect-error Different SystemContent types must not be interchangeable.
export const wrongEntity: SystemEntity<OtherType> = darkKnightEntity;
