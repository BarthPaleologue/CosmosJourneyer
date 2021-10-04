import { Crater } from "../terrain/crater/crater";
import { CraterModifiers } from "../forge/layers/craterModifiers";
import { NoiseModifiers } from "../forge/layers/noiseSettings";
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

    chunkForge: ChunkForge; // le CEO du terrain, tout simplement

    surfaceMaterial: BABYLON.ShaderMaterial;

    constructor(_id: string, _radius: number, _position: BABYLON.Vector3, _nbSubdivisions: number, _minDepth: number, _maxDepth: number, _forge: ChunkForge, _scene: BABYLON.Scene) {

        this.id = _id;
        this.radius = _radius;
        this.chunkLength = this.radius * 2;

        this.attachNode = BABYLON.Mesh.CreateBox(`${this.id}AttachNode`, 1, _scene);
        this.attachNode.position = _position;

        this.chunkForge = _forge;

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
            steepColor: new BABYLON.Vector3(165, 42, 42).scale(1 / 255),
            plainColor: new BABYLON.Vector3(0.5, 0.3, 0.08),
            sandColor: new BABYLON.Vector3(0.7, 0.7, 0),

            waterLevel: 0.32,
            sandSize: 1,
            steepSharpness: 1
        };

        this.craters = this.generateCraters(nbCraters, craterRadiusFactor, craterSteepnessFactor, craterMaxDepthFactor);

        let surfaceMaterial = new BABYLON.ShaderMaterial("surfaceColor", _scene, "./shaders/surfaceColor",
            {
                attributes: ["position", "normal", "uv"],
                uniforms: [
                    "world", "worldViewProjection", "projection", "view",
                    "textureSampler", "depthSampler",
                    "bottomNormalMap", "plainNormalMap", "sandNormalMap", "snowNormalMap", "steepNormalMap",
                    "cameraNear", "cameraFar", "planetPosition", "planetRadius",

                    "waterLevel", "sandSize", "steepSharpness",

                    "snowColor", "steepColor", "plainColor", "sandColor"
                ]
            }
        );

        surfaceMaterial.setTexture("bottomNormalMap", new BABYLON.Texture(crackednormal, _scene));
        surfaceMaterial.setTexture("steepNormalMap", new BABYLON.Texture(rockn, _scene));
        surfaceMaterial.setTexture("plainNormalMap", new BABYLON.Texture(grassn, _scene));
        surfaceMaterial.setTexture("snowNormalMap", new BABYLON.Texture(snowNormalMap, _scene));
        surfaceMaterial.setTexture("sandNormalMap", new BABYLON.Texture(sandNormalMap, _scene));

        surfaceMaterial.setVector3("v3CameraPos", BABYLON.Vector3.Zero());
        surfaceMaterial.setVector3("v3LightPos", BABYLON.Vector3.Zero());
        surfaceMaterial.setVector3("planetPosition", this.attachNode.absolutePosition);
        surfaceMaterial.setFloat("planetRadius", this.radius);

        this.surfaceMaterial = surfaceMaterial;

        this.sides = [
            new PlanetSide(`${this.id}UpSide`, _minDepth, _maxDepth, this.chunkLength, Direction.Up, this.attachNode, _scene, this.chunkForge, this.surfaceMaterial, this),
            new PlanetSide(`${this.id}DownSide`, _minDepth, _maxDepth, this.chunkLength, Direction.Down, this.attachNode, _scene, this.chunkForge, this.surfaceMaterial, this),
            new PlanetSide(`${this.id}ForwardSide`, _minDepth, _maxDepth, this.chunkLength, Direction.Forward, this.attachNode, _scene, this.chunkForge, this.surfaceMaterial, this),
            new PlanetSide(`${this.id}BackwardSide`, _minDepth, _maxDepth, this.chunkLength, Direction.Backward, this.attachNode, _scene, this.chunkForge, this.surfaceMaterial, this),
            new PlanetSide(`${this.id}RightSide`, _minDepth, _maxDepth, this.chunkLength, Direction.Right, this.attachNode, _scene, this.chunkForge, this.surfaceMaterial, this),
            new PlanetSide(`${this.id}LeftSide`, _minDepth, _maxDepth, this.chunkLength, Direction.Left, this.attachNode, _scene, this.chunkForge, this.surfaceMaterial, this),
        ];

        this.updateColors();
    }

    /**
     * Update terrain of the sphere relative to the observer position
     * @param position the observer position
     */
    updateLOD(position: BABYLON.Vector3, facingDirection: BABYLON.Vector3) {
        for (let side of this.sides) {
            side.updateLOD(position, facingDirection);
        }
    }

    setRenderDistanceFactor(renderDistanceFactor: number) {
        for (let side of this.sides) {
            side.renderDistanceFactor = renderDistanceFactor;
        }
    }

    /**
     * Changes the maximum depth of the quadtrees
     * @param maxDepth the new maximum depth of the quadtrees
     */
    setMaxDepth(maxDepth: number) {
        for (let side of this.sides) {
            side.maxDepth = maxDepth;
        }
    }

    /**
     * Changes the minimum depth of the quadtrees
     * @param minDepth the new minimum depth of the quadtrees
     */
    setMinDepth(minDepth: number) {
        for (let side of this.sides) {
            side.minDepth = minDepth;
        }
    }

    /**
     * Regenerates the chunks
     */
    reset() {
        for (let side of this.sides) {
            side.reset();
        }
    }

    updateColors() {
        this.surfaceMaterial.setFloat("planetRadius", this.radius);
        this.surfaceMaterial.setFloat("waterLevel", this.colorSettings.waterLevel);
        this.surfaceMaterial.setFloat("sandSize", this.colorSettings.sandSize);
        this.surfaceMaterial.setFloat("steepSharpness", this.colorSettings.steepSharpness);

        this.surfaceMaterial.setVector3("snowColor", this.colorSettings.snowColor);
        this.surfaceMaterial.setVector3("steepColor", this.colorSettings.steepColor);
        this.surfaceMaterial.setVector3("plainColor", this.colorSettings.plainColor);
        this.surfaceMaterial.setVector3("sandColor", this.colorSettings.sandColor);
    }

    update(position: BABYLON.Vector3, facingDirection: BABYLON.Vector3, lightPosition: BABYLON.Vector3, camera: BABYLON.Camera) {
        this.surfaceMaterial.setVector3("v3CameraPos", position);
        this.surfaceMaterial.setVector3("v3LightPos", lightPosition);
        this.updateLOD(position, facingDirection);
    }

    generateCraters(n: number, radiusModifier: number, _steepness: number, _maxDepth: number) {
        let craters: Crater[] = [];
        for (let i = 0; i < n; i++) {
            let r = radiusModifier * 0.1 * (Math.random() ** 16);
            // random spherical coordinates
            let phi = Math.random() * Math.PI * 2;
            let theta = Math.random() * Math.PI;
            let position = [Math.cos(theta) * Math.sin(phi), Math.sin(theta) * Math.sin(phi), Math.cos(phi)];

            let maxDepth = _maxDepth * (0.2 + (Math.random()) / 10);
            let steepness = _steepness * (1 + (Math.random()) / 10) / (r / 2);
            craters.push({ radius: r, position: position, maxDepth: maxDepth, steepness: steepness });
        }
        return craters;
    }

}