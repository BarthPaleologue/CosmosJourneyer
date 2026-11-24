import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import type { StarModel } from "@cosmos-journeyer/universe-model";
import { describe, expect, it, vi } from "vitest";

import { getSunModel } from "@/backend/universe/customSystems/sol/sun";

import type { Textures } from "@/frontend/assets/textures";
import { createTexturePools } from "@/frontend/assets/textures/texturePools";
import { Star } from "@/frontend/universe/stellarObjects/star/star";
import type { SpaceObject } from "@/frontend/universe/systemObject";

import { canEngageWarpDrive } from "./warpDriveUtils";

/**
 * Builds the texture bundle a ringed star needs, leaving the groups the star never reads unimplemented.
 * @param scene Scene that owns the ring textures and pooled procedural textures.
 * @returns A fully typed texture bundle with real ring textures and a real star-material LUT pool.
 */
function createStarTextures(scene: Scene): Textures {
    const texture = new Texture(null, scene);
    return {
        get terrains(): Textures["terrains"] {
            throw new Error("Terrain textures are not used by this fixture");
        },
        get water(): Textures["water"] {
            throw new Error("Water textures are not used by this fixture");
        },
        get particles(): Textures["particles"] {
            throw new Error("Particle textures are not used by this fixture");
        },
        get materials(): Textures["materials"] {
            throw new Error("Material textures are not used by this fixture");
        },
        get gasPlanet(): Textures["gasPlanet"] {
            throw new Error("Gas planet textures are not used by this fixture");
        },
        rings: { saturn: texture, uranus: texture },
        get environment(): Textures["environment"] {
            throw new Error("Environment textures are not used by this fixture");
        },
        get noises(): Textures["noises"] {
            throw new Error("Noise textures are not used by this fixture");
        },
        get ui(): Textures["ui"] {
            throw new Error("UI textures are not used by this fixture");
        },
        get empty(): Textures["empty"] {
            throw new Error("The empty texture is not used by this fixture");
        },
        pools: createTexturePools(scene),
    };
}

describe("warp clearance near entity geometry", () => {
    it.each([
        { position: 0, yaw: 0, speed: 0, allowed: false },
        { position: -103, yaw: 0, speed: 0, allowed: false },
        { position: -200, yaw: 0, speed: 0, allowed: true },
        { position: -200, yaw: 0, speed: 400, allowed: false },
        { position: -200, yaw: Math.PI, speed: 400, allowed: true },
    ])("at z=$position with yaw=$yaw and speed=$speed allows warp=$allowed", ({ position, yaw, speed, allowed }) => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const ship = new TransformNode("ship", scene);
        ship.position.z = position;
        ship.rotationQuaternion = Quaternion.RotationYawPitchRoll(yaw, 0, 0);
        ship.computeWorldMatrix(true);
        const station = new TransformNode("station", scene);
        const object: SpaceObject = {
            kind: "systemObject",
            object: {
                id: "station",
                name: "Station",
                getTransform: () => station,
                getBoundingRadius: () => 100,
            },
        };
        try {
            expect(canEngageWarpDrive(ship, null, speed, object)).toBe(allowed);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
    it.each([
        { height: 0, speed: 0, allowed: false },
        { height: 30, speed: 200, allowed: false },
        { height: 30, speed: 0, allowed: true },
    ])("preserves orbital ring clearance at height $height and speed $speed", ({ height, speed, allowed }) => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const ship = new TransformNode("ship", scene);
        ship.position.set(250, height, 0);
        ship.rotationQuaternion = Quaternion.RotationAxis(Vector3.Right(), Math.PI / 2);
        ship.computeWorldMatrix(true);
        const planet = new Star(
            {
                ...getSunModel(),
                radius: 100,
                rings: { type: "textured", textureId: "saturn", innerRadius: 200, outerRadius: 300 },
            } satisfies StarModel,
            createStarTextures(scene),
            scene,
        );
        const asteroidField = planet.asteroidField;
        if (asteroidField === null) {
            throw new Error("Expected the ringed star to have an asteroid field");
        }
        vi.spyOn(asteroidField, "getRingVolume").mockReturnValue({
            center: Vector3.Zero(),
            normal: Vector3.Up(),
            innerRadius: 200,
            outerRadius: 300,
            halfThickness: 10,
        });
        const object: SpaceObject = {
            kind: "orbitalObject",
            object: planet,
        };
        try {
            expect(canEngageWarpDrive(ship, null, speed, object)).toBe(allowed);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});
