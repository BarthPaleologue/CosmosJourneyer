import { NoiseEngine } from "../engine/perlin.js";
import { Crater } from "./forge/crater.js";
import { CraterModifiers } from "./forge/layers/craterModifiers.js";
import { NoiseModifiers } from "./forge/layers/noiseSettings.js";
import { ChunkForge } from "./forge/chunkForge.js";
import { PlanetSide } from "./forge/planetSide.js";
import { Direction } from "./forge/direction.js";

export interface ColorSettings {
    snowColor: BABYLON.Vector4,
    steepColor: BABYLON.Vector4,
    plainColor: BABYLON.Vector4,
    sandColor: BABYLON.Vector4,
    plainSteepDotLimit: number,
    snowSteepDotLimit: number,
    iceCapThreshold: number,
    waterLevel: number,
    sandSize: number,
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

    constructor(_id: string, _radius: number, _position: BABYLON.Vector3, _nbSubdivisions: number, _minDepth: number, _maxDepth: number, _scene: BABYLON.Scene) {
        //super(_id, _radius, _position, _nbSubdivisions, _minDepth, _maxDepth, _scene);

        this.id = _id;
        this.radius = _radius;
        this.chunkLength = this.radius * 2;

        this.attachNode = BABYLON.Mesh.CreateBox(`${this.id}AttachNode`, 1, _scene);
        this.attachNode.position = _position;
        //this.attachNode.physicsImpostor = new BABYLON.PhysicsImpostor(this.attachNode, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1 });
        //this.attachNode.showBoundingBox = true;
        //this.attachNode.collisionMask = 1;


        this.surfaceMaterial = new BABYLON.ShaderMaterial(`${this.id}BaseMaterial`, _scene, "");

        this.chunkForge = new ChunkForge(this.chunkLength, _nbSubdivisions, _scene);

        this.sides = [
            new PlanetSide(`${this.id}UpSide`, _minDepth, _maxDepth, this.chunkLength, _nbSubdivisions, Direction.Up, this.attachNode, _scene, this.chunkForge, this.surfaceMaterial),
            new PlanetSide(`${this.id}DownSide`, _minDepth, _maxDepth, this.chunkLength, _nbSubdivisions, Direction.Down, this.attachNode, _scene, this.chunkForge, this.surfaceMaterial),
            new PlanetSide(`${this.id}ForwardSide`, _minDepth, _maxDepth, this.chunkLength, _nbSubdivisions, Direction.Forward, this.attachNode, _scene, this.chunkForge, this.surfaceMaterial),
            new PlanetSide(`${this.id}BackwardSide`, _minDepth, _maxDepth, this.chunkLength, _nbSubdivisions, Direction.Backward, this.attachNode, _scene, this.chunkForge, this.surfaceMaterial),
            new PlanetSide(`${this.id}RightSide`, _minDepth, _maxDepth, this.chunkLength, _nbSubdivisions, Direction.Right, this.attachNode, _scene, this.chunkForge, this.surfaceMaterial),
            new PlanetSide(`${this.id}LeftSide`, _minDepth, _maxDepth, this.chunkLength, _nbSubdivisions, Direction.Left, this.attachNode, _scene, this.chunkForge, this.surfaceMaterial),
        ];

        let noiseEngine = new NoiseEngine();
        noiseEngine.seed(69);

        let nbCraters = 500;
        let craterRadiusFactor = .1 * this.radius;
        let craterSteepnessFactor = 1 * this.radius;
        let craterMaxDepthFactor = 1 * this.radius;

        this.noiseModifiers = {
            strengthModifier: 1,
            amplitudeModifier: 1,
            frequencyModifier: 1,
            offsetModifier: [0, 0, 0],
            minValueModifier: 1,
        };

        this.craterModifiers = {
            radiusModifier: this.radius / 5,
            steepnessModifier: this.radius / 5,
            maxDepthModifier: this.radius / 5,
            scaleFactor: this.radius / 5,
        };

        this.colorSettings = {
            snowColor: new BABYLON.Vector4(1, 1, 1, 1),
            steepColor: new BABYLON.Vector4(0.2, 0.2, 0.2, 1),
            plainColor: new BABYLON.Vector4(0.5, 0.3, 0.08, 1),
            sandColor: new BABYLON.Vector4(0.5, 0.5, 0, 1),
            plainSteepDotLimit: 0.95,
            snowSteepDotLimit: 0.94,
            iceCapThreshold: 9,
            waterLevel: 0.32,
            sandSize: 1,
        };

        this.craters = this.generateCraters(nbCraters, this.radius, craterRadiusFactor, craterSteepnessFactor, craterMaxDepthFactor);

        this.updateSettings();

        let surfaceMaterial = new BABYLON.ShaderMaterial("surfaceColor", _scene, "./shaders/surfaceColor",
            {
                attributes: ["position", "normal", "uv"],
                uniforms: [
                    "world", "worldViewProjection", "projection", "view",
                    "textureSampler", "depthSampler", "normalMap",
                    "cameraNear", "cameraFar"
                ]
            });
        //@ts-ignore
        surfaceMaterial.useLogarithmicDepth = true;
        surfaceMaterial.setTexture("normalMap", new BABYLON.Texture("./textures/crackednormal.jpg", _scene));
        surfaceMaterial.setVector3("v3CameraPos", BABYLON.Vector3.Zero());
        surfaceMaterial.setVector3("v3LightPos", BABYLON.Vector3.Zero());

        this.setChunkMaterial(surfaceMaterial);

        this.updateColors();
    }

    /**
     * Sets the material used on the chunks
     * @param material 
     */
    setChunkMaterial(material: BABYLON.ShaderMaterial) {
        this.surfaceMaterial = material;
        for (let side of this.sides) {
            side.setChunkMaterial(material);
        }
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
     * Regenerates the chunks
     */
    reset() {
        for (let side of this.sides) {
            side.reset();
        }
    }

    updateColors() {
        this.surfaceMaterial.setFloat("planetRadius", this.radius);
        this.surfaceMaterial.setFloat("iceCapThreshold", this.colorSettings.iceCapThreshold);
        this.surfaceMaterial.setFloat("steepSnowDotLimit", this.colorSettings.snowSteepDotLimit);
        this.surfaceMaterial.setFloat("waterLevel", this.colorSettings.waterLevel);
        this.surfaceMaterial.setFloat("sandSize", this.colorSettings.sandSize);

        this.surfaceMaterial.setVector4("snowColor", this.colorSettings.snowColor);
        this.surfaceMaterial.setVector4("steepColor", this.colorSettings.steepColor);
        this.surfaceMaterial.setVector4("plainColor", this.colorSettings.plainColor);
        this.surfaceMaterial.setVector4("sandColor", this.colorSettings.sandColor);
    }

    update(position: BABYLON.Vector3, facingDirection: BABYLON.Vector3, lightPosition: BABYLON.Vector3, camera: BABYLON.Camera) {
        this.surfaceMaterial.setVector3("v3CameraPos", position);
        this.surfaceMaterial.setVector3("v3LightPos", lightPosition);
        this.updateLOD(position, facingDirection);
    }

    updateSettings() {
        this.chunkForge.setPlanet(this.radius, this.craters, this.noiseModifiers, this.craterModifiers);
    }

    generateCraters(n: number, radius: number, radiusModifier: number, _steepness: number, _maxDepth: number) {
        let craters: Crater[] = [];
        for (let i = 0; i < n; i++) {
            let r = radiusModifier * (Math.random() ** 10);
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