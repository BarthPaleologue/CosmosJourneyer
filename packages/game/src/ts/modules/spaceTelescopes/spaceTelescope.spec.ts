//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { GetEnvironmentBRDFTexture } from "@babylonjs/core/Misc/brdfTextureTools";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import type { PhysicsEngine } from "@babylonjs/core/Physics/v2/physicsEngine";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { Scene } from "@babylonjs/core/scene";
import HavokPhysics from "@babylonjs/havok";
import type { HavokPhysicsWithBindings } from "@babylonjs/havok";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { FoilMaterial } from "@/frontend/assets/materials/foil";

import { getPhysicsEngineV2 } from "@/utils/physicsEngineV2";

import { CollisionMask } from "@/settings";

import { createPrimaryMirrorSegments } from "./primaryMirror";
import { SpaceTelescope } from "./spaceTelescope";
import { createSpaceTelescopeModel } from "./spaceTelescopeModel";

describe("SpaceTelescope resources", () => {
    let engine: NullEngine;
    let scene: Scene;
    let foil: FoilMaterial;
    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        scene.useRightHandedSystem = true;
        foil = new FoilMaterial(
            { albedo: new Texture(null, scene), normal: new Texture(null, scene), roughness: new Texture(null, scene) },
            scene,
        );
    });
    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("uses a single Y-up mirror mesh whose bounds contain every segment", () => {
        const model = createSpaceTelescopeModel();
        const telescope = new SpaceTelescope(model, foil, scene);
        const mirror = scene.getMeshByName("primaryMirror");
        expect(mirror).not.toBeNull();
        if (!(mirror instanceof Mesh)) {
            return;
        }
        const opticalAxis = Vector3.TransformNormal(Vector3.UpReadOnly, mirror.computeWorldMatrix(true));
        expect(opticalAxis.equalsWithEpsilon(Vector3.UpReadOnly)).toBe(true);
        const segments = createPrimaryMirrorSegments(model.primaryMirror);
        expect(mirror.thinInstanceCount).toBe(segments.length);
        expect(scene.meshes).toHaveLength(33);
        const bounds = mirror.getBoundingInfo().boundingBox;
        for (const { position: center } of segments) {
            expect(bounds.intersectsPoint(center)).toBe(true);
        }
        for (const mesh of scene.meshes) {
            expect(mesh.receiveShadows).toBe(true);
            mesh.computeWorldMatrix(true);
            for (const corner of mesh.getBoundingInfo().boundingBox.vectorsWorld) {
                expect(corner.length()).toBeLessThanOrEqual(telescope.radius + 1e-5);
            }
        }
        telescope.dispose();
    });

    it("releases owned resources while preserving shared foil material and textures on repeated unloading", () => {
        const sharedBRDF = GetEnvironmentBRDFTexture(scene);
        const baseline = {
            meshes: scene.meshes.length,
            geometries: scene.geometries.length,
            materials: scene.materials.length,
            textures: scene.textures.length,
            nodes: scene.transformNodes.length,
        };
        for (let i = 0; i < 3; i++) {
            const telescope = new SpaceTelescope(createSpaceTelescopeModel(), foil, scene);
            const materials = scene.materials.slice(baseline.materials);
            const textures = scene.textures.slice(baseline.textures);
            const disposedMaterials: string[] = [];
            const disposedTextures: string[] = [];
            materials.forEach((material) =>
                material.onDisposeObservable.add(() => disposedMaterials.push(material.name)),
            );
            textures.forEach((texture) => texture.onDisposeObservable.add(() => disposedTextures.push(texture.name)));
            telescope.dispose();
            expect(scene.textures).toContain(sharedBRDF);
            expect(disposedMaterials).toHaveLength(2);
            expect(scene.materials).toContain(foil.get());
            expect(disposedTextures).toHaveLength(0);
            expect({
                meshes: scene.meshes.length,
                geometries: scene.geometries.length,
                materials: scene.materials.length,
                textures: scene.textures.length,
                nodes: scene.transformNodes.length,
            }).toEqual(baseline);
        }
    });
});

describe("SpaceTelescope collisions", () => {
    let havok: HavokPhysicsWithBindings;
    let engine: NullEngine;
    let scene: Scene;
    let foil: FoilMaterial;
    let physics: PhysicsEngine;
    let telescope: SpaceTelescope;
    beforeAll(async () => {
        const wasmPath = createRequire(import.meta.url).resolve("@babylonjs/havok/lib/esm/HavokPhysics.wasm");
        const wasmBinary = new Uint8Array(await readFile(wasmPath)).buffer;
        havok = await HavokPhysics({ wasmBinary });
    });
    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        scene.useRightHandedSystem = true;
        foil = new FoilMaterial(
            { albedo: new Texture(null, scene), normal: new Texture(null, scene), roughness: new Texture(null, scene) },
            scene,
        );
        scene.enablePhysics(Vector3.Zero(), new HavokPlugin(true, havok));
        physics = getPhysicsEngineV2(scene);
        telescope = new SpaceTelescope(createSpaceTelescopeModel(), foil, scene);
    });
    afterEach(() => {
        telescope.dispose();
        scene.dispose();
        engine.dispose();
        vi.restoreAllMocks();
    });

    it("activates one static body nearby with hysteresis and frees it on departure and unloading", () => {
        const baselineMeshes = scene.meshes.length;
        const baselineGeometries = scene.geometries.length;
        const disposeShape = vi.spyOn(HavokPlugin.prototype, "disposeShape");
        telescope.update(new Vector3(13e3, 0, 0));
        expect(physics.getBodies()).toHaveLength(0);
        expect(scene.meshes).toHaveLength(baselineMeshes);
        for (let i = 0; i < 3; i++) {
            telescope.update(Vector3.Zero());
            const [body] = physics.getBodies();
            expect(physics.getBodies()).toHaveLength(1);
            expect(body).toBeDefined();
            if (body === undefined) {
                return;
            }
            expect(body.getMassProperties().mass).toBe(0);
            expect(body.disablePreStep).toBe(false);
            expect(scene.meshes).toHaveLength(baselineMeshes);
            expect(scene.geometries).toHaveLength(baselineGeometries);
            telescope.update(new Vector3(11e3, 0, 0));
            expect(physics.getBodies()).toEqual([body]);
            telescope.update(new Vector3(13e3, 0, 0));
            expect(body.isDisposed).toBe(true);
            // Two containers plus one shared shape per source mesh, including the instanced mirror.
            expect(disposeShape).toHaveBeenCalledTimes((i + 1) * (baselineMeshes + 2));
            expect(physics.getBodies()).toHaveLength(0);
            expect(scene.meshes).toHaveLength(baselineMeshes);
            expect(scene.geometries).toHaveLength(baselineGeometries);
        }
        telescope.update(Vector3.Zero());
        telescope.dispose();
        expect(disposeShape).toHaveBeenCalledTimes(4 * (baselineMeshes + 2));
        expect(physics.getBodies()).toHaveLength(0);
        expect(scene.meshes).toHaveLength(0);
    });

    it("collides with transformed mirror segments and both sides of sheets while leaving gaps open", () => {
        const root = telescope.getTransform();
        const placement = new TransformNode("orbitalPlacement", scene);
        placement.position.set(100, 200, 300);
        placement.rotationQuaternion = Quaternion.RotationYawPitchRoll(0.4, 0.2, 0.1);
        root.parent = placement;
        const mirror = scene.getMeshByName("primaryMirror");
        expect(mirror).not.toBeNull();
        if (mirror === null) {
            return;
        }
        mirror.position.set(2, 3, 4);
        mirror.rotationQuaternion = Quaternion.RotationYawPitchRoll(0.2, -0.1, 0.3);
        mirror.scaling.setAll(1.2);
        root.computeWorldMatrix(true);
        telescope.update(root.getAbsolutePosition());
        physics._step(1 / 60);
        const ray = (from: Vector3, to: Vector3) => {
            const world = root.computeWorldMatrix(true);
            return physics.raycast(Vector3.TransformCoordinates(from, world), Vector3.TransformCoordinates(to, world), {
                membership: CollisionMask.DYNAMIC_OBJECTS,
                collideWith: CollisionMask.ENVIRONMENT,
            });
        };
        const segments = createPrimaryMirrorSegments(createSpaceTelescopeModel().primaryMirror);
        const expectMirrorHits = () => {
            for (const index of [0, segments.length / 2, segments.length - 1]) {
                const segment = segments[index];
                expect(segment).toBeDefined();
                if (segment === undefined) {
                    continue;
                }
                const instance = Matrix.Compose(Vector3.OneReadOnly, segment.rotation, segment.position);
                const from = Vector3.TransformCoordinates(new Vector3(0, 0.5, 0), instance);
                const to = Vector3.TransformCoordinates(new Vector3(0, -0.5, 0), instance);
                const mirrorWorld = mirror.computeWorldMatrix(true);
                expect(
                    physics.raycast(
                        Vector3.TransformCoordinates(from, mirrorWorld),
                        Vector3.TransformCoordinates(to, mirrorWorld),
                        { membership: CollisionMask.DYNAMIC_OBJECTS, collideWith: CollisionMask.ENVIRONMENT },
                    ).hasHit,
                ).toBe(true);
            }
        };
        expectMirrorHits();
        const world = root.computeWorldMatrix(true);
        expect(
            physics.raycast(
                Vector3.TransformCoordinates(new Vector3(10, -44, 10), world),
                Vector3.TransformCoordinates(new Vector3(10, -46, 10), world),
                { membership: CollisionMask.ENVIRONMENT, collideWith: CollisionMask.EVERYTHING },
            ).hasHit,
        ).toBe(false);
        for (let i = 0; i < 7; i++) {
            const y = -45 - i * 5;
            const above = new Vector3(10, y + 1, 10);
            const below = new Vector3(10, y - 1, 10);
            expect(ray(above, below).hasHit).toBe(true);
            expect(ray(below, above).hasHit).toBe(true);
        }
        expect(ray(new Vector3(-20, -47.5, 10), new Vector3(20, -47.5, 10)).hasHit).toBe(false);
        expect(ray(new Vector3(10, 8, -2), new Vector3(10, 8, 2)).hasHit).toBe(false);
        // Orbital placement / floating-origin changes must also move the static collider.
        placement.position.addInPlace(new Vector3(500, -100, 20));
        placement.rotationQuaternion = Quaternion.RotationYawPitchRoll(0.8, -0.2, 0.4);
        root.computeWorldMatrix(true);
        physics._step(1 / 60);
        expectMirrorHits();
        expect(ray(new Vector3(10, -44, 10), new Vector3(10, -46, 10)).hasHit).toBe(true);
    });

    it("deflects a moving dynamic body off an insulation sheet", () => {
        const root = telescope.getTransform();
        const world = root.computeWorldMatrix(true);
        telescope.update(Vector3.Zero());
        const sphere = CreateSphere("collisionProbe", { diameter: 1 }, scene);
        sphere.position.copyFrom(Vector3.TransformCoordinates(new Vector3(10, -42, 10), world));
        const probe = new PhysicsAggregate(sphere, PhysicsShapeType.SPHERE, { mass: 1, restitution: 0 }, scene);
        probe.shape.filterMembershipMask = CollisionMask.DYNAMIC_OBJECTS;
        probe.shape.filterCollideMask = CollisionMask.ENVIRONMENT;
        probe.body.setLinearVelocity(Vector3.TransformNormal(new Vector3(0, -5, 0), world));
        for (let i = 0; i < 120; i++) {
            physics._step(1 / 60);
        }
        sphere.computeWorldMatrix(true);
        const localPosition = Vector3.TransformCoordinates(sphere.getAbsolutePosition(), world.clone().invert());
        expect(localPosition.y).toBeGreaterThan(-45);
        expect(localPosition.y).toBeLessThan(-43);
        const localVelocity = Vector3.TransformNormal(probe.body.getLinearVelocity(), world.clone().invert());
        expect(localVelocity.y).toBeGreaterThan(0);
        probe.dispose();
        sphere.dispose();
    });
});
