import { Scene } from "@babylonjs/core/scene";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { getForwardDirection, rotate } from "../uberCore/transforms/basicTransform";
import { LinesMesh, TransformNode } from "@babylonjs/core/Meshes";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";

import warpConeFragment from "../../shaders/warpConeMaterial/fragment.glsl";
import warpConeVertex from "../../shaders/warpConeMaterial/vertex.glsl";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Assets } from "../assets";
import { Transformable } from "../architecture/transformable";

/**
 * @see https://playground.babylonjs.com/#W9LE0U#28
 */
export class HyperSpaceTunnel implements Transformable {
    maxNbDrops = 500;
    maxLineSize = 12.0;
    positiveDepth = 600.0;
    negativeDepth = 100.0;
    radius = 50;
    minSpeed = 200.0;
    maxSpeed = 400.0;

    drops: [Vector3, Vector3][] = [];
    speeds: number[] = [];
    colors: [Color4, Color4][] = [];
    deltaSpeed: number;

    private parent: TransformNode | null = null;

    readonly direction: Vector3;
    readonly v1: Vector3;
    readonly v2: Vector3;

    readonly spaceLines: LinesMesh;
    readonly warpCone: Mesh;

    readonly warpConeMaterial: ShaderMaterial;

    private throttle = 1;

    private diameterTop = 0;
    private diameterBottom = 160;

    private elapsedSeconds = 0;

    constructor(direction: Vector3, scene: Scene) {
        this.deltaSpeed = this.maxSpeed - this.minSpeed;

        this.direction = direction;

        // find two orthogonal vectors to the direction vector (see  https://en.wikipedia.org/wiki/Gram%E2%80%93Schmidt_process)
        const v1 = new Vector3(Math.random(), Math.random(), Math.random()).normalize();
        v1.subtractInPlace(this.direction.scale(this.direction.dot(v1))).normalize();

        const v2 = Vector3.Cross(this.direction, v1).normalize();

        this.v1 = v1;
        this.v2 = v2;

        for (let d = 0; d < this.maxNbDrops; d++) {
            this.drops.push(this.getRandomStartingPositions());

            const color0 = new Color4(1.0, 1.0, 0.7, 1.0);
            const color1 = new Color4(1.0, 1.0, 0.7, 1.0);
            this.colors.push([color0, color1]);

            this.speeds.push(this.minSpeed + this.deltaSpeed * Math.random());
        }

        this.spaceLines = MeshBuilder.CreateLineSystem(
            "rain",
            {
                lines: this.drops,
                updatable: true,
                colors: this.colors
            },
            scene
        );

        this.warpCone = MeshBuilder.CreateCylinder(
            "cone",
            {
                diameterTop: this.diameterTop,
                diameterBottom: this.diameterBottom,
                height: this.positiveDepth + this.negativeDepth,
                sideOrientation: Mesh.BACKSIDE,
                subdivisions: 64
            },
            scene
        );
        this.warpCone.parent = this.parent;
        this.warpCone.rotation.x = Math.PI / 2;
        this.warpCone.position.z = this.positiveDepth / 2;
        this.warpCone.bakeCurrentTransformIntoVertices();

        Effect.ShadersStore["warpConeMaterialFragmentShader"] = warpConeFragment;
        Effect.ShadersStore["warpConeMaterialVertexShader"] = warpConeVertex;
        this.warpConeMaterial = new ShaderMaterial("warpConeMaterial", scene, "warpConeMaterial", {
            attributes: ["position", "uv"],
            uniforms: ["worldViewProjection", "time"],
            samplers: ["warpNoise"]
        });
        this.warpConeMaterial.setTexture("warpNoise", Assets.SEAMLESS_PERLIN);

        this.warpCone.material = this.warpConeMaterial;
    }

    private getRandomStartingPositions(): [Vector3, Vector3] {
        const theta = Math.random() * Math.PI * 2;
        const radiusScaling = 1 + (Math.random() * 2 - 1) * 0.5;

        const p0 = new Vector3(Math.cos(theta), Math.sin(theta), 0).scale((radiusScaling * this.diameterTop) / 2);
        const p1 = new Vector3(Math.cos(theta), Math.sin(theta), 0).scale((radiusScaling * this.diameterBottom) / 2);
        p0.addInPlace(this.direction.scale(this.positiveDepth));
        p1.subtractInPlace(this.direction.scale(this.negativeDepth));

        const direction = p1.subtract(p0).normalize();

        const lineSize = this.maxLineSize * Math.random();

        const point0 = p0;
        const point1 = point0.add(direction.scale(lineSize));

        return [point0, point1];
    }

    setParent(parent: TransformNode) {
        this.parent = parent;
    }

    setEnabled(enabled: boolean) {
        this.spaceLines.setEnabled(enabled);
        this.warpCone.setEnabled(enabled);
    }

    getTransform(): TransformNode {
        return this.spaceLines;
    }

    rainFalls(deltaTime: number) {
        for (let d = 0; d < this.maxNbDrops; d++) {
            const drop = this.drops[d];
            const speed = this.speeds[d] * this.throttle;
            const direction = drop[0].subtract(drop[1]).normalize();
            drop[0].subtractInPlace(direction.scale(speed * deltaTime));
            drop[1].subtractInPlace(direction.scale(speed * deltaTime));

            if (drop[0].dot(this.direction) < -this.negativeDepth) {
                const [point0, point1] = this.getRandomStartingPositions();

                drop[0].copyFrom(point0);
                drop[1].copyFrom(point1);
            }
        }
    }

    update(deltaSeconds: number) {
        this.elapsedSeconds += deltaSeconds;

        this.warpConeMaterial.setFloat("time", this.elapsedSeconds);
        this.rainFalls(deltaSeconds);

        MeshBuilder.CreateLineSystem("rain", { lines: this.drops, instance: this.spaceLines });

        if (this.parent === null) return;

        this.spaceLines.position = this.parent.getAbsolutePosition();
        this.warpCone.position = this.parent.getAbsolutePosition();

        const targetForward = getForwardDirection(this.parent);
        const currentForward = getForwardDirection(this.getTransform());

        if (targetForward.equalsWithEpsilon(currentForward, 0.001)) return;

        const rotationAxis = Vector3.Cross(currentForward, targetForward);
        const theta = Math.acos(Vector3.Dot(currentForward, targetForward));

        rotate(this.spaceLines, rotationAxis, theta);
        rotate(this.warpCone, rotationAxis, theta);
    }

    dispose() {
        this.spaceLines.dispose();
        this.warpCone.dispose();
    }
}
