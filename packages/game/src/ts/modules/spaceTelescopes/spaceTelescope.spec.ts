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

import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { GetEnvironmentBRDFTexture } from "@babylonjs/core/Misc/brdfTextureTools";
import { Scene } from "@babylonjs/core/scene";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createPrimaryMirrorMatrices } from "./primaryMirror";
import { SpaceTelescope } from "./spaceTelescope";
import { createSpaceTelescopeModel } from "./spaceTelescopeModel";

describe("SpaceTelescope resources", () => {
    let engine: NullEngine;
    let scene: Scene;
    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        scene.useRightHandedSystem = true;
    });
    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("uses a single mirror mesh whose bounds contain every segment", () => {
        const model = createSpaceTelescopeModel();
        const telescope = new SpaceTelescope(model, scene);
        const mirror = scene.getMeshByName("primaryMirror");
        expect(mirror).not.toBeNull();
        if (!(mirror instanceof Mesh)) {
            return;
        }
        const matrices = createPrimaryMirrorMatrices(model.primaryMirror);
        expect(mirror.thinInstanceCount).toBe(matrices.length / 16);
        expect(scene.meshes).toHaveLength(33);
        const bounds = mirror.getBoundingInfo().boundingBox;
        for (let i = 0; i < matrices.length; i += 16) {
            const center = new Vector3(matrices[i + 12], matrices[i + 13], matrices[i + 14]);
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

    it("releases owned meshes, geometries, materials, textures and nodes on repeated unloading", () => {
        const sharedBRDF = GetEnvironmentBRDFTexture(scene);
        const baseline = {
            meshes: scene.meshes.length,
            geometries: scene.geometries.length,
            materials: scene.materials.length,
            textures: scene.textures.length,
            nodes: scene.transformNodes.length,
        };
        for (let i = 0; i < 3; i++) {
            const telescope = new SpaceTelescope(createSpaceTelescopeModel(), scene);
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
            expect(disposedMaterials).toHaveLength(3);
            expect(disposedTextures).toHaveLength(3);
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
