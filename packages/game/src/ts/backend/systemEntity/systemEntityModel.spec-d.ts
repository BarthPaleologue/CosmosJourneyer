import { expectTypeOf, test } from "vitest";

import type {
    InOrbitPlacementModel,
    OnSurfacePlacementModel,
    SystemContentModel,
    SystemEntityModel,
    SystemEntityPlacementModel,
} from "./systemEntityModel";

type TestModel = SystemContentModel<"placement-test">;
type OrbitalEntity = SystemEntityModel<TestModel, InOrbitPlacementModel>;
type SurfaceEntity = SystemEntityModel<TestModel, OnSurfacePlacementModel>;

test("entity models accept both placements by default", () => {
    expectTypeOf<SystemEntityModel<TestModel>["placement"]>().toEqualTypeOf<SystemEntityPlacementModel>();
});

test("entity models can restrict placements without widening the content model", () => {
    expectTypeOf<OrbitalEntity["placement"]>().toEqualTypeOf<InOrbitPlacementModel>();
    expectTypeOf<SurfaceEntity["placement"]>().toEqualTypeOf<OnSurfacePlacementModel>();
    expectTypeOf<OrbitalEntity["content"]>().toEqualTypeOf<TestModel>();
});

declare const surfacePlacement: OnSurfacePlacementModel;

test("a surface placement cannot be assigned to an orbital-only entity", () => {
    // @ts-expect-error Orbital-only entities must reject surface placements.
    const invalidPlacement: OrbitalEntity["placement"] = surfacePlacement;
    expectTypeOf(invalidPlacement).toEqualTypeOf<InOrbitPlacementModel>();
});
