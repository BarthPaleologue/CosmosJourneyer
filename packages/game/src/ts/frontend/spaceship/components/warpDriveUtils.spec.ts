import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { describe, expect, it } from "vitest";

import type { OrbitalObject } from "@/frontend/universe/architecture/orbitalObject";
import type { SystemObject } from "@/frontend/universe/systemObject";

import { canEngageWarpDrive } from "./warpDriveUtils";

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
        const object: SystemObject = {
            id: "station",
            name: "Station",
            getTransform: () => station,
            getBoundingRadius: () => 100,
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
        const planet = new TransformNode("planet", scene);
        const object = {
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
        } as unknown as OrbitalObject;
        try {
            expect(canEngageWarpDrive(ship, null, speed, object)).toBe(allowed);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});
