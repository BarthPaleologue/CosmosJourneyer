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

import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PhysicsMotionType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { type PhysicsShape } from "@babylonjs/core/Physics/v2/physicsShape";
import type { Scene } from "@babylonjs/core/scene";
import { assertUnreachable } from "@cosmos-journeyer/typescript";
import { z } from "zod";

import type { Objects } from "@/frontend/assets/objects";
import { createInstancePatch } from "@/frontend/helpers/instancing";
import type { StellarLightSystem } from "@/frontend/helpers/stellarLightSystem";

export const AssetTypeSchema = z.enum(["grass", "rock", "tree", "butterfly"]);

export type AssetType = z.infer<typeof AssetTypeSchema>;

const InstanceBuffersSchema = z.object({
    matrices: z.instanceof(Float32Array),
    positions: z.instanceof(Float32Array),
    rotations: z.instanceof(Float32Array),
    scales: z.instanceof(Float32Array),
    count: z.number(),
});

type InstanceBuffers = z.infer<typeof InstanceBuffersSchema>;

export const ScatteredInstanceBuffersSchema = z.partialRecord(AssetTypeSchema, InstanceBuffersSchema);

export type ScatteredInstanceBuffers = z.infer<typeof ScatteredInstanceBuffersSchema>;

type ScatteredInstances = {
    mesh: Mesh;
    bodies: Array<PhysicsBody>;
};

export interface IScatteringSystem {
    scatterInChunk(chunkTransform: TransformNode, scattering: ScatteredInstanceBuffers): void;

    clearChunk(chunkId: string): void;

    dispose(): void;
}

export class ScatteringSystem implements IScatteringSystem {
    private readonly assets: Objects;

    private readonly chunkToScatteredAssets = new Map<string, Partial<Record<AssetType, ScatteredInstances>>>();

    private readonly stellarLightSystem: StellarLightSystem;

    private readonly scene: Scene;

    public constructor(assets: Objects, stellarLightSystem: StellarLightSystem, scene: Scene) {
        this.assets = assets;
        this.stellarLightSystem = stellarLightSystem;
        this.scene = scene;
    }

    public scatterInChunk(chunkTransform: TransformNode, scattering: ScatteredInstanceBuffers): void {
        this.clearChunk(chunkTransform.name);

        const chunkPatches: Partial<Record<AssetType, ScatteredInstances>> = {};
        for (const [assetType, buffers] of Object.entries(scattering) as Iterable<
            [AssetType, ScatteredInstanceBuffers[AssetType]]
        >) {
            if (buffers === undefined) {
                continue;
            }

            let mesh: Mesh;
            const bodies: Array<PhysicsBody> = [];
            switch (assetType) {
                case "grass":
                    mesh = this.assets.grassBlades[0];
                    break;
                case "rock":
                    mesh = this.assets.rock.mesh;
                    this.scatterPhysicsBodies(chunkTransform, buffers, this.assets.rock.sizeToShape, bodies);
                    break;
                case "tree":
                    mesh = this.assets.tree;
                    break;
                case "butterfly":
                    mesh = this.assets.butterfly;
                    break;
                default:
                    assertUnreachable(assetType);
            }

            mesh = createInstancePatch(`${chunkTransform.name}_${assetType}`, mesh, buffers.matrices);

            const chunkAbsolutePosition = chunkTransform.getAbsolutePosition();
            const chunkRotationQuaternion = chunkTransform.absoluteRotationQuaternion;

            mesh.position.copyFrom(chunkAbsolutePosition);
            mesh.rotationQuaternion = chunkRotationQuaternion;
            mesh.computeWorldMatrix(true);
            mesh.receiveShadows = true;

            switch (assetType) {
                case "rock":
                case "tree":
                    this.stellarLightSystem.addShadowCaster(mesh);
                    break;
                case "grass":
                case "butterfly":
                    break;
                default:
                    assertUnreachable(assetType);
            }

            chunkPatches[assetType] = { mesh, bodies };
        }

        this.chunkToScatteredAssets.set(chunkTransform.name, chunkPatches);
    }

    private scatterPhysicsBodies(
        chunkTransform: TransformNode,
        buffers: InstanceBuffers,
        sizeToShape: Map<number, PhysicsShape>,
        out: Array<PhysicsBody>,
    ): void {
        for (let i = 0; i < buffers.count; i++) {
            const scale = buffers.scales[i];
            if (scale === undefined) {
                console.warn(`No scale found for instance ${i}`);
                continue;
            }

            const shape = sizeToShape.get(scale);
            if (shape === undefined) {
                console.warn(`No physics shape found for scale ${scale}`);
                continue;
            }

            const transform = new TransformNode("bodyTransform", this.scene);
            transform.parent = chunkTransform;
            transform.position = new Vector3(
                buffers.positions[i * 3],
                buffers.positions[i * 3 + 1],
                buffers.positions[i * 3 + 2],
            );
            transform.rotationQuaternion = new Quaternion(
                buffers.rotations[i * 4],
                buffers.rotations[i * 4 + 1],
                buffers.rotations[i * 4 + 2],
                buffers.rotations[i * 4 + 3],
            );

            const body = new PhysicsBody(transform, PhysicsMotionType.STATIC, false, this.scene);
            body.shape = shape;
            out.push(body);
        }
    }

    public clearChunk(chunkId: string): void {
        const chunkPatches = this.chunkToScatteredAssets.get(chunkId);
        if (chunkPatches === undefined) {
            return;
        }

        for (const { mesh, bodies } of Object.values(chunkPatches)) {
            for (const body of bodies) {
                body.dispose();
                body.transformNode.dispose();
            }
            mesh.dispose();
        }

        this.chunkToScatteredAssets.delete(chunkId);
    }

    public dispose() {
        for (const patches of this.chunkToScatteredAssets.values()) {
            for (const { mesh, bodies } of Object.values(patches)) {
                for (const body of bodies) {
                    body.dispose();
                    body.transformNode.dispose();
                }
                mesh.dispose();
            }
        }
        this.chunkToScatteredAssets.clear();
    }
}

export class ScatteringSystemMock implements IScatteringSystem {
    scatterInChunk(): void {
        // do nothing
    }

    clearChunk(): void {
        // do nothing
    }

    dispose(): void {
        // do nothing
    }
}
