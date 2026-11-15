import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { describe, expect, it } from "vitest";

import { canEngageWarpDrive } from "./components/warpDriveUtils";
import { Spaceship } from "./spaceship";

describe("spaceship warp clearance with entity geometry and celestial rings", () => {
    it.each([
        { height: 0, speed: 0, entityDistance: 50, allowed: false },
        { height: 30, speed: 200, entityDistance: 50, allowed: false },
        { height: 30, speed: 0, entityDistance: 50, allowed: true },
        { height: 30, speed: 0, entityDistance: 0, allowed: false },
    ])(
        "at height $height, speed $speed and entity distance $entityDistance allows warp=$allowed",
        ({ height, speed, entityDistance, allowed }) => {
            const engine = new NullEngine();
            const scene = new Scene(engine);
            const ship = new TransformNode("ship", scene);
            ship.position.set(250, height, 0);
            ship.rotationQuaternion = Quaternion.RotationAxis(Vector3.Right(), Math.PI / 2);
            ship.computeWorldMatrix(true);
            const planet = new TransformNode("planet", scene);
            const entity = new TransformNode("entity", scene);
            entity.position.copyFrom(ship.position).x -= entityDistance;
            const nearestObject = {
                id: "entity",
                name: "Entity",
                getTransform: () => entity,
                getBoundingRadius: () => 10,
            };
            const altimeter = { getAltitude: () => null };
            const context = {
                nearestObject,
                nearestCelestialBody: {
                    type: "gasPlanet",
                    getTransform: () => planet,
                    getBoundingRadius: () => 100,
                    asteroidField: {
                        getRingVolume: () => ({
                            center: Vector3.Zero(),
                            normal: Vector3.Up(),
                            innerRadius: 200,
                            outerRadius: 300,
                            halfThickness: 10,
                        }),
                    },
                },
                getTransform: () => ship,
                getAltimeter: () => altimeter,
            } as unknown as Spaceship;
            try {
                expect(canEngageWarpDrive(ship, altimeter.getAltitude(), speed, nearestObject)).toBe(
                    entityDistance > 0,
                );
                expect(Spaceship.prototype.canEngageWarpDrive.call(context, speed)).toBe(allowed);
            } finally {
                scene.dispose();
                engine.dispose();
            }
        },
    );
    it.each([
        { altitude: 1000, planetDistance: 7_200_000, allowed: true },
        { altitude: 20, planetDistance: 7_200_000, allowed: false },
        { altitude: 1000, planetDistance: 6_100_000, allowed: false },
    ])(
        "with station altitude $altitude and planet distance $planetDistance allows warp=$allowed",
        ({ altitude, planetDistance, allowed }) => {
            const engine = new NullEngine();
            const scene = new Scene(engine);
            const ship = new TransformNode("ship", scene);
            ship.position.z = planetDistance;
            const planet = new TransformNode("planet", scene);
            const station = new TransformNode("station", scene);
            station.position.z = planetDistance - 2000;
            const context = {
                nearestObject: {
                    getTransform: () => station,
                    getBoundingRadius: () => 1000,
                },
                nearestCelestialBody: {
                    type: "telluricPlanet",
                    getTransform: () => planet,
                    getBoundingRadius: () => 6_000_000,
                    asteroidField: null,
                },
                getTransform: () => ship,
                getAltimeter: () => ({ getAltitude: () => altitude }),
            } as unknown as Spaceship;
            try {
                expect(Spaceship.prototype.canEngageWarpDrive.call(context, 0)).toBe(allowed);
            } finally {
                scene.dispose();
                engine.dispose();
            }
        },
    );
});
