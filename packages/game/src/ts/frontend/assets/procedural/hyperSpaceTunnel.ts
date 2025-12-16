import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Axis, Space } from "@babylonjs/core/Maths/math.axis";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type TransformNode } from "@babylonjs/core/Meshes";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { type Scene } from "@babylonjs/core/scene";

import { type NoiseTextures } from "@/frontend/assets/textures/noises";
import { rotate } from "@/frontend/helpers/transform";
import { type Transformable } from "@/frontend/universe/architecture/transformable";

import { clamp } from "@/utils/math";

import warpConeFragment from "@shaders/warpConeMaterial/fragment.glsl";
import warpConeVertex from "@shaders/warpConeMaterial/vertex.glsl";

/**
 * @see https://playground.babylonjs.com/#W9LE0U#28
 */
export class HyperSpaceTunnel implements Transformable {
    private parent: TransformNode | null = null;

    readonly direction: Vector3;
    readonly v1: Vector3;
    readonly v2: Vector3;

    readonly hyperTunnel: Mesh;

    readonly warpConeMaterial: ShaderMaterial;

    private tunnelDiameter = 160;

    private elapsedSeconds = 0;

    constructor(direction: Vector3, scene: Scene, noiseTextures: NoiseTextures) {
        this.direction = direction;

        // find two orthogonal vectors to the direction vector (see  https://en.wikipedia.org/wiki/Gram%E2%80%93Schmidt_process)
        const v1 = new Vector3(Math.random(), Math.random(), Math.random()).normalize();
        v1.subtractInPlace(this.direction.scale(this.direction.dot(v1))).normalize();

        const v2 = Vector3.Cross(this.direction, v1).normalize();

        this.v1 = v1;
        this.v2 = v2;

        const path: Vector3[] = [];
        const nbPoint = 100;
        const tunnelOffset = 500;
        path.push(new Vector3(0, 0, 200));
        for (let i = 0; i < nbPoint; i++) {
            path.push(new Vector3(0, tunnelOffset * (i / nbPoint) ** 4, -(800 * i) / nbPoint));
        }

        this.hyperTunnel = MeshBuilder.CreateTube(
            "hyperTunnel",
            {
                radius: this.tunnelDiameter / 2,
                path: path,
                sideOrientation: Mesh.BACKSIDE,
                tessellation: 128,
            },
            scene,
        );

        Effect.ShadersStore["warpConeMaterialFragmentShader"] = warpConeFragment;
        Effect.ShadersStore["warpConeMaterialVertexShader"] = warpConeVertex;
        this.warpConeMaterial = new ShaderMaterial("warpConeMaterial", scene, "warpConeMaterial", {
            attributes: ["position", "uv"],
            uniforms: ["worldViewProjection", "time"],
            samplers: ["warpNoise"],
        });
        this.warpConeMaterial.setTexture("warpNoise", noiseTextures.seamlessPerlin);

        this.hyperTunnel.material = this.warpConeMaterial;
    }

    setParent(parent: TransformNode) {
        this.parent = parent;
    }

    setEnabled(enabled: boolean) {
        this.hyperTunnel.setEnabled(enabled);
    }

    getTransform(): TransformNode {
        return this.hyperTunnel;
    }

    update(deltaSeconds: number) {
        this.elapsedSeconds += deltaSeconds;

        this.warpConeMaterial.setFloat("time", this.elapsedSeconds);

        if (this.parent === null) return;

        this.hyperTunnel.position = this.parent.getAbsolutePosition();

        const rotationFrequency = 0.05;
        this.hyperTunnel.rotate(
            Axis.Z,
            0.005 * Math.sin(2.0 * Math.PI * rotationFrequency * this.elapsedSeconds),
            Space.LOCAL,
        );

        const targetForward = this.parent.forward;
        const currentForward = this.getTransform().forward;

        if (targetForward.equalsWithEpsilon(currentForward, 0.001)) return;

        const rotationAxis = Vector3.Cross(currentForward, targetForward);
        const theta = Math.acos(clamp(Vector3.Dot(currentForward, targetForward), -1, 1));

        rotate(this.hyperTunnel, rotationAxis, theta);
    }

    dispose() {
        this.hyperTunnel.dispose();
    }
}
