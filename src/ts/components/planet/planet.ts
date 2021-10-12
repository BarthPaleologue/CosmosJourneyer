import { Crater, generateCraters } from "../terrain/crater/crater";
import { CraterModifiers } from "../terrain/crater/craterModifiers";
import { NoiseModifiers } from "../terrain/landscape/noiseSettings";
import { ChunkForge } from "../forge/chunkForge";
import { PlanetSide } from "./planetSide";
import { Direction } from "../toolbox/direction";

//texture import
import crackednormal from "../../../asset/textures/crackednormal.jpg";
import rockn from "../../../asset/textures/rockn.png";
import grassn from "../../../asset/textures/grassn.png";
import snowNormalMap from "../../../asset/textures/snowNormalMap.jpg";
import sandNormalMap from "../../../asset/textures/sandNormalMap.jpg";

export interface ColorSettings {
    snowColor: BABYLON.Vector3,
    steepColor: BABYLON.Vector3,
    plainColor: BABYLON.Vector3,
    sandColor: BABYLON.Vector3,

    waterLevel: number,
    sandSize: number,
    steepSharpness: number;
}

export class Planet {

    id: string;

    noiseModifiers: NoiseModifiers;

    craters: Crater[];
    craterModifiers: CraterModifiers;

    colorSettings: ColorSettings;

    radius: number; // radius of sphere
    chunkLength: number; // length of eachChunk

    attachNode: BABYLON.Mesh; // reprensents the center of the sphere
    sides: PlanetSide[] = new Array(6); // stores the 6 sides of the sphere

    surfaceMaterial: BABYLON.ShaderMaterial;

    constructor(id: string, radius: number, position: BABYLON.Vector3, minDepth: number, maxDepth: number, chunkForge: ChunkForge, scene: BABYLON.Scene) {

        this.id = id;
        this.radius = radius;
        this.chunkLength = this.radius * 2;

        this.attachNode = BABYLON.Mesh.CreateBox(`${this.id}AttachNode`, 1, scene);
        this.attachNode.position = position;

        let nbCraters = 800;
        let craterRadiusFactor = 1;
        let craterSteepnessFactor = 1;
        let craterMaxDepthFactor = 1;

        this.noiseModifiers = {
            amplitudeModifier: 1,
            frequencyModifier: 1,
            offsetModifier: [0, 0, 0],
            minValueModifier: 1,
            archipelagoFactor: 0.5,
        };

        this.craterModifiers = {
            radiusModifier: 1,
            steepnessModifier: 1,
            maxDepthModifier: 1,
            scaleFactor: 1,
        };

        this.colorSettings = {
            snowColor: new BABYLON.Vector3(1, 1, 1),
            steepColor: new BABYLON.Vector3(70, 42, 42).scale(1 / 255),
            plainColor: new BABYLON.Vector3(0.5, 0.3, 0.08),
            sandColor: new BABYLON.Vector3(0.7, 0.7, 0.5),

            waterLevel: 0.32,
            sandSize: 1,
            steepSharpness: 1
        };

        this.craters = generateCraters(nbCraters, craterRadiusFactor, craterSteepnessFactor, craterMaxDepthFactor);

        let surfaceMaterial = new BABYLON.ShaderMaterial("surfaceColor", scene, "./shaders/surfaceColor",
            {
                attributes: ["position", "normal", "uv"],
                uniforms: [
                    "world", "worldViewProjection", "projection", "view",
                    "textureSampler", "depthSampler",
                    "bottomNormalMap", "plainNormalMap", "sandNormalMap", "snowNormalMap", "steepNormalMap",
                    "cameraNear", "cameraFar", "planetPosition", "planetRadius", "planetWorldMatrix",

                    "waterLevel", "sandSize", "steepSharpness",

                    "snowColor", "steepColor", "plainColor", "sandColor"
                ]
            }
        );

        surfaceMaterial.setTexture("bottomNormalMap", new BABYLON.Texture(crackednormal, scene));
        surfaceMaterial.setTexture("steepNormalMap", new BABYLON.Texture(rockn, scene));
        surfaceMaterial.setTexture("plainNormalMap", new BABYLON.Texture(grassn, scene));
        surfaceMaterial.setTexture("snowNormalMap", new BABYLON.Texture(snowNormalMap, scene));
        surfaceMaterial.setTexture("sandNormalMap", new BABYLON.Texture(sandNormalMap, scene));

        surfaceMaterial.setVector3("v3CameraPos", BABYLON.Vector3.Zero());
        surfaceMaterial.setVector3("v3LightPos", BABYLON.Vector3.Zero());
        surfaceMaterial.setVector3("planetPosition", this.attachNode.absolutePosition);
        surfaceMaterial.setFloat("planetRadius", this.radius);

        //surfaceMaterial.wireframe = true;

        surfaceMaterial.depthFunction = 1;

        //surfaceMaterial.wireframe = true;

        this.surfaceMaterial = surfaceMaterial;

        this.sides = [
            new PlanetSide(`${this.id}UpSide`, minDepth, maxDepth, this.chunkLength, Direction.Up, this.attachNode, scene, chunkForge, this.surfaceMaterial, this),
            new PlanetSide(`${this.id}DownSide`, minDepth, maxDepth, this.chunkLength, Direction.Down, this.attachNode, scene, chunkForge, this.surfaceMaterial, this),
            new PlanetSide(`${this.id}ForwardSide`, minDepth, maxDepth, this.chunkLength, Direction.Forward, this.attachNode, scene, chunkForge, this.surfaceMaterial, this),
            new PlanetSide(`${this.id}BackwardSide`, minDepth, maxDepth, this.chunkLength, Direction.Backward, this.attachNode, scene, chunkForge, this.surfaceMaterial, this),
            new PlanetSide(`${this.id}RightSide`, minDepth, maxDepth, this.chunkLength, Direction.Right, this.attachNode, scene, chunkForge, this.surfaceMaterial, this),
            new PlanetSide(`${this.id}LeftSide`, minDepth, maxDepth, this.chunkLength, Direction.Left, this.attachNode, scene, chunkForge, this.surfaceMaterial, this),
        ];

        this.updateColors();
    }

    /**
     * Update terrain of the sphere relative to the observer position
     * @param position the observer position
     */
    private updateLOD(position: BABYLON.Vector3, facingDirection: BABYLON.Vector3) {
        for (let side of this.sides) {
            side.updateLOD(position, facingDirection);
        }
    }

    public setRenderDistanceFactor(renderDistanceFactor: number) {
        for (let side of this.sides) {
            side.renderDistanceFactor = renderDistanceFactor;
        }
    }

    /**
     * Changes the maximum depth of the quadtrees
     * @param maxDepth the new maximum depth of the quadtrees
     */
    public setMaxDepth(maxDepth: number) {
        for (let side of this.sides) {
            side.maxDepth = maxDepth;
        }
    }

    /**
     * Changes the minimum depth of the quadtrees
     * @param minDepth the new minimum depth of the quadtrees
     */
    public setMinDepth(minDepth: number) {
        for (let side of this.sides) {
            side.minDepth = minDepth;
        }
    }

    /**
     * Regenerates the chunks
     */
    public reset() {
        for (let side of this.sides) {
            side.reset();
        }
    }

    /**
     * Updates surfaceMaterial with its new values
     */
    public updateColors() {
        this.surfaceMaterial.setFloat("planetRadius", this.radius);
        this.surfaceMaterial.setFloat("waterLevel", this.colorSettings.waterLevel);
        this.surfaceMaterial.setFloat("sandSize", this.colorSettings.sandSize);
        this.surfaceMaterial.setFloat("steepSharpness", this.colorSettings.steepSharpness);

        this.surfaceMaterial.setVector3("snowColor", this.colorSettings.snowColor);
        this.surfaceMaterial.setVector3("steepColor", this.colorSettings.steepColor);
        this.surfaceMaterial.setVector3("plainColor", this.colorSettings.plainColor);
        this.surfaceMaterial.setVector3("sandColor", this.colorSettings.sandColor);
    }

    public update(position: BABYLON.Vector3, facingDirection: BABYLON.Vector3, lightPosition: BABYLON.Vector3, camera: BABYLON.Camera) {
        this.surfaceMaterial.setVector3("v3CameraPos", position);
        this.surfaceMaterial.setVector3("v3LightPos", lightPosition);
        this.surfaceMaterial.setVector3("planetPosition", this.attachNode.absolutePosition);

        this.surfaceMaterial.setMatrix("planetWorldMatrix", this.attachNode.getWorldMatrix());
        this.updateLOD(position, facingDirection);
    }
}