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

import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";

import type { Transformable } from "@/frontend/universe/architecture/transformable";

import { SpaceDotsMaterial, type SpaceDotsMaterialOptions } from "./spaceDotsMaterial";

export type SpaceDotsOptions = SpaceDotsMaterialOptions;

const DEFAULT_INSTANCE_COUNT = 10_000;

export class SpaceDots implements Transformable {
    private readonly mesh: Mesh;
    private readonly material: SpaceDotsMaterial;

    private throttle = 0;
    private readonly options: SpaceDotsOptions | undefined;

    constructor(scene: Scene, options?: SpaceDotsOptions) {
        this.options = options;

        this.mesh = new Mesh("SpaceDotQuad", scene);
        this.mesh.alwaysSelectAsActiveMesh = true;
        this.mesh.isPickable = false;

        const positions = new Float32Array([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0]);
        const indices = new Uint32Array([0, 1, 2, 0, 2, 3]);

        const vertexData = new VertexData();
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.applyToMesh(this.mesh);

        const instanceCount = options?.instanceCount ?? DEFAULT_INSTANCE_COUNT;
        const instanceBuffer = new VertexBuffer(
            scene.getEngine(),
            new Float32Array(instanceCount),
            "instanceDummy",
            false,
            false,
            1,
            true,
        );
        this.mesh.setVerticesBuffer(instanceBuffer);
        this.mesh.forcedInstanceCount = instanceCount;

        this.material = new SpaceDotsMaterial(scene, options);
        this.mesh.material = this.material.get();
    }

    public setThrottle(throttle: number): void {
        this.throttle = Math.min(Math.max(throttle, 0), 1);
        this.getTransform().setEnabled(this.throttle > 0);
        this.material.setThrottle(this.throttle);
    }

    public update(deltaSeconds: number): void {
        this.material.update(deltaSeconds);
    }

    public getTransform(): TransformNode {
        return this.mesh;
    }

    public dispose() {
        this.material.dispose();
        this.mesh.dispose(false, true);
    }
}
