import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { LandingPadProvider, LandingPadSize } from "../universe/orbitalFacility/landingPadProvider";
import type { ILandingPad } from "../universe/orbitalFacility/landingPadProvider";
import type { SystemObject } from "../universe/systemObject";
import { findLandingFacility } from "./landingFacility";
import { makeSystemContentType } from "./systemEntity";
import type { SystemContent, SystemEntity } from "./systemEntity";
import { SystemEntityProcessors } from "./systemEntityProcessors";

describe("landing facility ownership", () => {
    let engine: NullEngine;
    let scene: Scene;
    let processors: SystemEntityProcessors;
    const type = makeSystemContentType<{ type: "facility" }, SystemContent>("facility");
    const providers = new Map<string, LandingPadProvider>();
    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        processors = new SystemEntityProcessors();
        providers.clear();
        processors.spatialGeometry.register(type, (entity) => ({
            getTransform: () => entity.content.getTransform(),
            getBoundingRadius: () => 100,
        }));
        processors.landingPadProviders.register(type, (entity) => providers.get(entity.model.id) ?? null);
    });
    afterEach(() => {
        processors.dispose();
        scene.dispose();
        engine.dispose();
    });

    /**
     * @param id Facility identifier.
     * @returns An entity with one landing pad.
     */
    function facility(id: string): { entity: SystemEntity; pad: ILandingPad; object: SystemObject } {
        const transform = new TransformNode(id, scene);
        const padTransform = new TransformNode(`${id}-pad`, scene);
        padTransform.parent = transform;
        const pad: ILandingPad = {
            getTransform: () => padTransform,
            getBoundingRadius: () => 10,
            getIdentifier: () => "A",
            getPadSize: () => LandingPadSize.SMALL,
            getPadHeight: () => 1,
        };
        providers.set(id, new LandingPadProvider([pad]));
        return {
            entity: {
                model: {
                    id,
                    name: id,
                    content: { type: "facility" },
                    placement: {
                        type: "onSurface",
                        parentId: "planet",
                        position: { longitude: 0, latitude: 0, heightAboveGround: 0 },
                        rotation: { heading: 0, pitch: 0, roll: 0 },
                    },
                },
                content: {
                    getTransform: () => transform,
                    dispose: () => {
                        transform.dispose();
                    },
                },
                placement: { type: "onSurface", getTransform: () => transform },
            },
            object: { id, name: id, getTransform: () => transform, getBoundingRadius: () => 100 },
            pad,
        };
    }

    it("offers pads only when the nearest object is a landable entity", () => {
        const station = facility("station");
        expect(findLandingFacility([station.entity], processors, station.object, null)?.object.id).toBe("station");
        expect(findLandingFacility([station.entity], processors, { ...station.object, id: "planet" }, null)).toBeNull();
    });

    it("keeps a reserved pad with its owner after the nearest object changes and releases it there", () => {
        const first = facility("first");
        const second = facility("second");
        const provider = providers.get("first");
        if (provider === undefined) {
            throw new Error("Missing provider");
        }
        const pad = provider.handleLandingRequest({ minimumPadSize: LandingPadSize.SMALL });
        expect(pad).toBe(first.pad);
        const selected = findLandingFacility([second.entity, first.entity], processors, second.object, pad);
        expect(selected?.object.id).toBe("first");
        expect(provider.getAvailableLandingPads()).toHaveLength(0);
        selected?.pads.cancelLandingRequest(first.pad);
        expect(provider.getAvailableLandingPads()).toEqual([first.pad]);
        expect(providers.get("second")?.getAvailableLandingPads()).toEqual([second.pad]);
    });

    it("does not assign a foreign pad to the nearest installation", () => {
        const first = facility("first");
        const second = facility("second");
        expect(findLandingFacility([first.entity], processors, first.object, second.pad)).toBeNull();
    });
});
