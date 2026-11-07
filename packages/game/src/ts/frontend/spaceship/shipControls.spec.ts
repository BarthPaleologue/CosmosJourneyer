//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import "@babylonjs/core/Physics/physicsEngineComponent";

import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Observable } from "@babylonjs/core/Misc/observable";
import { PhysicsMotionType, PhysicsPrestepType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { Scene } from "@babylonjs/core/scene";
import HavokPhysics from "@babylonjs/havok";
import type { TFunction } from "i18next";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

import type { ISoundPlayer } from "../audio/soundPlayer";
import type { ITts } from "../audio/tts";
import { FloatingOriginSystem } from "../helpers/floatingOriginSystem";
import type { INotificationManager } from "../ui/notificationManager";
import { ShipControls } from "./shipControls";
import type { Spaceship } from "./spaceship";

describe("ShipControls camera transforms", () => {
    const engine = new NullEngine();
    let scene: Scene;
    let controls: ShipControls;

    afterAll(() => {
        engine.dispose();
    });

    afterEach(() => {
        controls.dispose({} as ISoundPlayer);
        scene.dispose();
        vi.restoreAllMocks();
    });

    /** @returns The ship transform controlled by the test fixture. */
    function createControls(): TransformNode {
        scene = new Scene(engine);
        const ship = new TransformNode("ship", scene);
        ship.rotationQuaternion = Quaternion.Identity();
        const spaceship = {
            getTransform: () => ship,
            boundingExtent: Vector3.One(),
            onFuelScoopStart: new Observable(),
            onFuelScoopEnd: new Observable(),
            onLowFuelWarning: new Observable(),
            onLandingObservable: new Observable(),
            onPlanetaryLandingEngaged: new Observable(),
            onLandingCancelled: new Observable(),
            onTakeOff: new Observable(),
            onAutoPilotEngaged: new Observable(),
            onWarpDriveDisabled: new Observable(),
            onWarpDriveEnabled: new Observable(),
            getInternals: () => ({ getWarpDrive: () => null }),
            isAutoPiloted: () => true,
            isLanded: () => true,
            spaceDots: { setSteering: vi.fn() },
            update: vi.fn(),
            increaseMainEngineThrottle: vi.fn(),
            getThrottle: () => 0,
            dispose: vi.fn(),
        } as unknown as Spaceship;
        controls = new ShipControls(
            spaceship,
            scene,
            {} as ISoundPlayer,
            {} as ITts,
            {} as INotificationManager,
            (() => "") as unknown as TFunction,
        );
        return ship;
    }

    for (const synchronize of ["finalizeCamera", "syncCameraTransform"] as const) {
        it.each([false, true])(`${synchronize} copies the world position (parented: %s)`, (parented) => {
            const ship = createControls();
            if (parented) {
                const parent = new TransformNode("parent", scene);
                parent.position.set(1000, 2000, 3000);
                parent.rotationQuaternion = Quaternion.RotationYawPitchRoll(0.4, 0.2, 0.1);
                parent.computeWorldMatrix(true);
                ship.parent = parent;
            }
            ship.position.set(200000, 20, 30);
            const rig = controls.thirdPersonCameraTransform;
            const ownedPosition = rig.position;
            const expectedPosition = ship.getAbsolutePosition().clone();

            controls[synchronize](0);

            expect(rig.position.asArray()).toEqual(expectedPosition.asArray());
            expect(rig.position).toBe(ownedPosition);
            expect(rig.position).not.toBe(ship.position);
            expect(rig.position).not.toBe(ship.getAbsolutePosition());
        });

        it(`${synchronize} prevents camera movement from modifying the ship position`, () => {
            const ship = createControls();
            ship.position.set(200000, 20, 30);
            ship.computeWorldMatrix(true);
            controls[synchronize](0);

            controls.thirdPersonCameraTransform.setAbsolutePosition(new Vector3(-400000, 0, 0));

            expect(ship.position.asArray()).toEqual([200000, 20, 30]);
            expect(ship.getAbsolutePosition().asArray()).toEqual([200000, 20, 30]);
        });

        it(`${synchronize} keeps ship matrices valid when the camera rig is refreshed`, () => {
            const ship = createControls();
            controls[synchronize](0);
            ship.computeWorldMatrix(true);
            ship.position.set(200000, 20, 30);
            scene.incrementRenderId();

            controls.thirdPersonCameraTransform.computeWorldMatrix(true);

            expect(ship.getAbsolutePosition().asArray()).toEqual([200000, 20, 30]);
            expect(ship.getWorldMatrix().getTranslation().asArray()).toEqual([200000, 20, 30]);
        });

        it(`${synchronize} follows Havok teleports and rebases across motion type changes`, async () => {
            const ship = createControls();
            const wasmPath = createRequire(import.meta.url).resolve("@babylonjs/havok/lib/esm/HavokPhysics.wasm");
            const wasmBinary = new Uint8Array(await readFile(wasmPath)).buffer;
            const havok = await HavokPhysics({ wasmBinary });
            const plugin = new HavokPlugin(true, havok);
            scene.enablePhysics(Vector3.Zero(), plugin);
            const body = new PhysicsBody(ship, PhysicsMotionType.ANIMATED, false, scene);
            body.disablePreStep = false;
            const nativeTransform = new TransformNode("nativeBodyProbe", scene);
            const origin = new FloatingOriginSystem(scene, 100000);
            try {
                expect(body.getPrestepType()).toBe(PhysicsPrestepType.TELEPORT);
                for (const motionType of [PhysicsMotionType.ANIMATED, PhysicsMotionType.DYNAMIC]) {
                    body.setMotionType(motionType);
                    ship.setAbsolutePosition(new Vector3(200000, 20, 30));
                    plugin.executeStep(1 / 60, [body]);
                    ship.computeWorldMatrix(true);
                    controls[synchronize](0);
                    controls.thirdPersonCameraTransform.computeWorldMatrix(true);
                    controls.thirdPersonCamera.getViewMatrix(true);
                    const cameraPosition = controls.thirdPersonCamera.globalPosition.clone();
                    const expectedPosition = ship.position.subtract(cameraPosition);

                    origin.update(cameraPosition);
                    plugin.executeStep(1 / 60, [body]);
                    ship.computeWorldMatrix(true);
                    controls[synchronize](0);
                    controls.thirdPersonCameraTransform.computeWorldMatrix(true);
                    controls.thirdPersonCamera.getViewMatrix(true);

                    expect(ship.position.equalsWithEpsilon(expectedPosition, 0.1)).toBe(true);
                    plugin.syncTransform(body, nativeTransform);
                    expect(nativeTransform.position.equalsWithEpsilon(expectedPosition, 0.1)).toBe(true);
                    expect(controls.thirdPersonCamera.globalPosition.length()).toBeLessThan(0.1);
                    expect(body.disablePreStep).toBe(false);
                    expect(body.disableSync).toBe(false);
                }
            } finally {
                body.dispose();
            }
        });

        it(`${synchronize} preserves ship and camera separation through successive rebases`, () => {
            const ship = createControls();
            const origin = new FloatingOriginSystem(scene, 100000);
            const rig = controls.thirdPersonCameraTransform;
            for (const destination of [new Vector3(200000, 30, 40), new Vector3(-400000, 50, 60)]) {
                ship.setAbsolutePosition(destination);
                ship.computeWorldMatrix(true);
                controls[synchronize](0);
                rig.computeWorldMatrix(true);
                controls.thirdPersonCamera.getViewMatrix(true);
                const cameraPosition = controls.thirdPersonCamera.globalPosition.clone();
                const separation = cameraPosition.subtract(destination);

                origin.update(cameraPosition);
                controls.thirdPersonCamera.getViewMatrix(true);

                expect(ship.getAbsolutePosition().equalsWithEpsilon(separation.negate(), 0.1)).toBe(true);
                expect(rig.getAbsolutePosition().equalsWithEpsilon(ship.getAbsolutePosition(), 0.1)).toBe(true);
                expect(ship.getWorldMatrix().getTranslation().equalsWithEpsilon(ship.position, 0.1)).toBe(true);
                expect(controls.thirdPersonCamera.globalPosition.length()).toBeLessThan(0.1);
            }
        });
    }

    it("finalizes the third-person rig against a landing pad that advances after controls update", () => {
        const ship = createControls();
        const station = new TransformNode("station", scene);
        station.rotationQuaternion = Quaternion.Identity();
        const bay = new TransformNode("bay", scene);
        bay.parent = station;
        bay.position.set(500, 0, 0);
        bay.rotationQuaternion = Quaternion.Identity();
        bay.computeWorldMatrix(true);
        ship.parent = bay;
        ship.position.set(500, 10, 0);
        ship.computeWorldMatrix(true);
        controls.syncCameraTransform();
        controls.finalizeCamera(0);

        const angularSpeed = 0.0443;
        for (const deltaSeconds of [1 / 60, 1 / 50, 1 / 144, 1 / 30]) {
            controls.update(deltaSeconds);
            const rigBeforePadAdvance = controls.thirdPersonCameraTransform.getAbsolutePosition().clone();
            bay.rotate(Axis.Y, angularSpeed * deltaSeconds);
            ship.computeWorldMatrix(true);

            expect(Vector3.Distance(rigBeforePadAdvance, ship.getAbsolutePosition())).toBeGreaterThan(0.1);

            controls.finalizeCamera(deltaSeconds);
            controls.thirdPersonCamera.getViewMatrix(true);

            expect(controls.thirdPersonCameraTransform.getAbsolutePosition().asArray()).toEqual(
                ship.getAbsolutePosition().asArray(),
            );
            expect(Vector3.Distance(controls.thirdPersonCamera.globalPosition, ship.getAbsolutePosition())).toBeCloseTo(
                controls.thirdPersonCamera.radius,
                4,
            );
        }
    });

    it("preserves world-space rotation smoothing while finalizing a parented ship", () => {
        const ship = createControls();
        const pad = new TransformNode("pad", scene);
        pad.position.set(500, 0, 0);
        pad.rotationQuaternion = Quaternion.Identity();
        pad.computeWorldMatrix(true);
        ship.parent = pad;
        ship.position.set(0, 10, 0);
        ship.rotationQuaternion = Quaternion.Identity();
        ship.computeWorldMatrix(true);

        controls.syncCameraTransform();
        const previousRigRotation = controls.thirdPersonCameraTransform.rotationQuaternion?.clone();
        if (previousRigRotation === undefined) {
            throw new Error("Third-person rig has no rotation quaternion");
        }

        const deltaSeconds = 1 / 60;
        const rotationHalfLife = 0.3;
        pad.rotate(Axis.Y, 0.2);
        ship.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), 0.4);
        ship.computeWorldMatrix(true);
        const targetRotation = ship.absoluteRotationQuaternion.clone();
        const expectedRotation = Quaternion.Slerp(
            targetRotation,
            previousRigRotation,
            2 ** (-deltaSeconds / rotationHalfLife),
        );

        controls.finalizeCamera(deltaSeconds);

        const actualRotation = controls.thirdPersonCameraTransform.rotationQuaternion;
        if (actualRotation === null) {
            throw new Error("Third-person rig has no rotation quaternion");
        }
        expect(Math.abs(Quaternion.Dot(actualRotation, expectedRotation))).toBeCloseTo(1, 9);
        expect(Math.abs(Quaternion.Dot(actualRotation, targetRotation))).toBeLessThan(0.999);
    });

    it("advances camera preset animations during finalization", () => {
        createControls();
        controls.thirdPersonCamera.alpha = 0;
        controls.thirdPersonCamera.beta = 0.1;
        controls.thirdPersonCamera.radius = 10;
        controls.reset();
        const alphaBefore = controls.thirdPersonCamera.alpha;

        controls.finalizeCamera(0.5);

        expect(controls.thirdPersonCamera.alpha).not.toBe(alphaBefore);
    });

    it("keeps a parented ship coherent with its camera through floating-origin rebasing", () => {
        const ship = createControls();
        const pad = new TransformNode("pad", scene);
        pad.position.set(500, 0, 0);
        pad.rotationQuaternion = Quaternion.Identity();
        pad.computeWorldMatrix(true);
        ship.parent = pad;
        ship.position.set(0, 10, 0);
        ship.computeWorldMatrix(true);

        controls.syncCameraTransform();
        controls.finalizeCamera(0);
        controls.thirdPersonCamera.getViewMatrix(true);
        const cameraPosition = controls.thirdPersonCamera.globalPosition.clone();

        const floatingOrigin = new FloatingOriginSystem(scene, 1);
        floatingOrigin.update(cameraPosition);
        controls.finalizeCamera(0);
        controls.thirdPersonCamera.getViewMatrix(true);

        expect(controls.thirdPersonCameraTransform.getAbsolutePosition().asArray()).toEqual(
            ship.getAbsolutePosition().asArray(),
        );
        expect(controls.thirdPersonCamera.globalPosition.length()).toBeLessThan(0.1);
    });

    it("finalizes the camera across landing and take-off reparenting", () => {
        const ship = createControls();
        const pad = new TransformNode("pad", scene);
        pad.position.set(500, 0, 0);
        pad.rotationQuaternion = Quaternion.Identity();
        pad.computeWorldMatrix(true);

        ship.parent = pad;
        ship.position.set(0, 10, 0);
        ship.computeWorldMatrix(true);
        controls.syncCameraTransform();
        controls.finalizeCamera(1 / 60);
        expect(controls.thirdPersonCameraTransform.getAbsolutePosition().asArray()).toEqual(
            ship.getAbsolutePosition().asArray(),
        );

        ship.setParent(null);
        ship.setAbsolutePosition(pad.getAbsolutePosition().add(new Vector3(0, 20, 0)));
        controls.syncCameraTransform();
        controls.finalizeCamera(1 / 60);
        expect(controls.thirdPersonCameraTransform.getAbsolutePosition().asArray()).toEqual(
            ship.getAbsolutePosition().asArray(),
        );
    });
});
