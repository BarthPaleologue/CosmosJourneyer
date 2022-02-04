import { Crater, generateCraters } from "../../terrain/crater/crater";
import { ChunkForge } from "../../forge/chunkForge";
import { PlanetSide } from "./planetSide";
import { Direction } from "../../toolbox/direction";

//texture import
import crackednormal from "../../../../asset/textures/crackednormal.jpg";
import rockn from "../../../../asset/textures/rockn.png";
import grassn from "../../../../asset/textures/grassn.png";
import snowNormalMap from "../../../../asset/textures/snowNormalMap.png";
import sandNormalMap from "../../../../asset/textures/sandNormalMap.jpg";
import { TerrainSettings } from "../../terrain/terrainSettings";
import { PhysicalProperties, Planet } from "../planet";

export interface ColorSettings {
    snowColor: BABYLON.Vector3,
    steepColor: BABYLON.Vector3,
    plainColor: BABYLON.Vector3,
    sandColor: BABYLON.Vector3,

    waterLevel: number,
    sandSize: number,
    steepSharpness: number;
    normalSharpness: number;

    snowElevation01: number;
    snowOffsetAmplitude: number;
    snowLacunarity: number;
    snowLatitudePersistence: number;
    steepSnowDotLimit: number;
}

export interface SolidPhysicalProperties extends PhysicalProperties {
    waterAmount: number;
}

export class SolidPlanet extends Planet {

    craters: Crater[];

    public colorSettings: ColorSettings;
    readonly _physicalProperties: SolidPhysicalProperties;

    public terrainSettings: TerrainSettings;

    readonly rootChunkLength: number; // length of eachChunk

    readonly maxDepth: number;

    readonly attachNode: BABYLON.Mesh; // reprensents the center of the sphere
    readonly sides: PlanetSide[] = new Array(6); // stores the 6 sides of the sphere

    surfaceMaterial: BABYLON.ShaderMaterial;

    constructor(id: string, radius: number, position: BABYLON.Vector3, minDepth: number, scene: BABYLON.Scene, physicalProperties: SolidPhysicalProperties = {
        minTemperature: -50,
        maxTemperature: 50,
        pressure: 1,
        waterAmount: 1
    }, seed = [0, 0, 0]) {
        super(id, radius, seed);

        this._physicalProperties = physicalProperties;

        this.rootChunkLength = this._radius * 2;

        this.maxDepth = Math.round(Math.log2(radius) - 12);

        let spaceBetweenVertex = this.rootChunkLength / (64 * 2 ** this.maxDepth);
        console.log(spaceBetweenVertex);

        this.attachNode = BABYLON.Mesh.CreateBox(`${this._name}AttachNode`, 1, scene);
        this.attachNode.position = position;

        let nbCraters = 800;
        let craterRadiusFactor = 1;
        let craterSteepnessFactor = 1;
        let craterMaxDepthFactor = 1;

        this.terrainSettings = {
            continentsFragmentation: 0.47,
            continentBaseHeight: 5e3,

            maxBumpHeight: 100,
            bumpsFrequency: 1,

            maxMountainHeight: 30e3,
            mountainsFrequency: 2e-3,
            mountainsMinValue: 0.5
        };

        this.colorSettings = {
            snowColor: new BABYLON.Vector3(1, 1, 1),
            steepColor: new BABYLON.Vector3(55, 42, 42).scale(1 / 255),
            plainColor: new BABYLON.Vector3(0.5, 0.3, 0.08),
            sandColor: new BABYLON.Vector3(0.7, 0.7, 0.2),

            waterLevel: 0.32,
            sandSize: 1,
            steepSharpness: 1,
            normalSharpness: 0.8,

            snowElevation01: 0.8,
            snowOffsetAmplitude: 0.05,
            snowLacunarity: 4,
            snowLatitudePersistence: 3,
            steepSnowDotLimit: 0.8,
        };

        //this.craters = generateCraters(nbCraters, craterRadiusFactor, craterSteepnessFactor, craterMaxDepthFactor);
        this.craters = [];

        let surfaceMaterial = new BABYLON.ShaderMaterial("surfaceColor", scene, "./shaders/surfaceColor",
            {
                attributes: ["position", "normal", "uv"],
                uniforms: [
                    "world", "worldViewProjection", "projection", "view",
                    "textureSampler", "depthSampler",
                    "bottomNormalMap", "plainNormalMap", "sandNormalMap", "snowNormalMap", "steepNormalMap",
                    "cameraNear", "cameraFar", "planetPosition", "planetRadius", "planetWorldMatrix",

                    "playerPosition",

                    "waterLevel", "sandSize", "steepSharpness", "normalSharpness",

                    "snowColor", "steepColor", "plainColor", "sandColor",

                    "maxElevation",

                    "snowElevation01", "snowOffsetAmplitude", "snowLacunarity",
                    "snowLatitudePersistence", "steepSnowDotLimit",

                    "minTemperature", "maxTemperature",

                    "waterAmount"
                ]
            }
        );

        surfaceMaterial.setTexture("bottomNormalMap", new BABYLON.Texture(crackednormal, scene));
        surfaceMaterial.setTexture("steepNormalMap", new BABYLON.Texture(rockn, scene));
        surfaceMaterial.setTexture("plainNormalMap", new BABYLON.Texture(grassn, scene));
        surfaceMaterial.setTexture("snowNormalMap", new BABYLON.Texture(snowNormalMap, scene));
        surfaceMaterial.setTexture("sandNormalMap", new BABYLON.Texture(sandNormalMap, scene));

        surfaceMaterial.setVector3("playerPosition", BABYLON.Vector3.Zero());
        surfaceMaterial.setVector3("sunPosition", BABYLON.Vector3.Zero());
        surfaceMaterial.setVector3("planetPosition", this.attachNode.absolutePosition);
        surfaceMaterial.setFloat("planetRadius", this._radius);

        surfaceMaterial.setFloat("normalSharpness", this.colorSettings.normalSharpness);

        // déharcoder le bouzin
        surfaceMaterial.setFloat("maxElevation", this.terrainSettings.continentBaseHeight + this.terrainSettings.maxMountainHeight + this.terrainSettings.maxBumpHeight);

        surfaceMaterial.setFloat("snowElevation01", this.colorSettings.snowElevation01);
        surfaceMaterial.setFloat("snowOffsetAmplitude", this.colorSettings.snowOffsetAmplitude);
        surfaceMaterial.setFloat("snowLacunarity", this.colorSettings.snowLacunarity);
        surfaceMaterial.setFloat("snowLatitudePersistence", this.colorSettings.snowLatitudePersistence);
        surfaceMaterial.setFloat("steepSnowDotLimit", this.colorSettings.steepSnowDotLimit);

        surfaceMaterial.setFloat("minTemperature", this._physicalProperties.minTemperature);
        surfaceMaterial.setFloat("maxTemperature", this._physicalProperties.maxTemperature);

        surfaceMaterial.setFloat("waterAmount", this._physicalProperties.waterAmount);

        this.surfaceMaterial = surfaceMaterial;

        this.sides = [
            new PlanetSide(`${this._name}UpSide`, minDepth, this.maxDepth, this.rootChunkLength, Direction.Up, this.attachNode, scene, this.surfaceMaterial, this),
            new PlanetSide(`${this._name}DownSide`, minDepth, this.maxDepth, this.rootChunkLength, Direction.Down, this.attachNode, scene, this.surfaceMaterial, this),
            new PlanetSide(`${this._name}ForwardSide`, minDepth, this.maxDepth, this.rootChunkLength, Direction.Forward, this.attachNode, scene, this.surfaceMaterial, this),
            new PlanetSide(`${this._name}BackwardSide`, minDepth, this.maxDepth, this.rootChunkLength, Direction.Backward, this.attachNode, scene, this.surfaceMaterial, this),
            new PlanetSide(`${this._name}RightSide`, minDepth, this.maxDepth, this.rootChunkLength, Direction.Right, this.attachNode, scene, this.surfaceMaterial, this),
            new PlanetSide(`${this._name}LeftSide`, minDepth, this.maxDepth, this.rootChunkLength, Direction.Left, this.attachNode, scene, this.surfaceMaterial, this),
        ];

        this.updateColors();
    }
    public setChunkForge(chunkForge: ChunkForge): void {
        for (const planetSide of this.sides) {
            planetSide.setChunkForge(chunkForge);
        }
    }

    /**
     * Update terrain of the sphere relative to the observer position
     * @param position the observer position
     */
    private updateLOD(observerPosition: BABYLON.Vector3, observerDirection: BABYLON.Vector3): void {
        for (let side of this.sides) {
            side.updateLOD(observerPosition, observerDirection);
        }
    }

    public setRenderDistanceFactor(renderDistanceFactor: number): void {
        for (let side of this.sides) {
            side.renderDistanceFactor = renderDistanceFactor;
        }
    }

    /**
     * Regenerates the chunks
     */
    public reset(): void {
        for (let side of this.sides) {
            side.reset();
        }
    }

    /**
     * Updates surfaceMaterial with its new values
     */
    public updateColors(): void {
        this.surfaceMaterial.setFloat("planetRadius", this._radius);
        this.surfaceMaterial.setFloat("waterLevel", this.colorSettings.waterLevel);
        this.surfaceMaterial.setFloat("sandSize", this.colorSettings.sandSize);
        this.surfaceMaterial.setFloat("steepSharpness", this.colorSettings.steepSharpness);

        this.surfaceMaterial.setVector3("snowColor", this.colorSettings.snowColor);
        this.surfaceMaterial.setVector3("steepColor", this.colorSettings.steepColor);
        this.surfaceMaterial.setVector3("plainColor", this.colorSettings.plainColor);
        this.surfaceMaterial.setVector3("sandColor", this.colorSettings.sandColor);

        this.surfaceMaterial.setFloat("normalSharpness", this.colorSettings.normalSharpness);

        this.surfaceMaterial.setFloat("snowElevation01", this.colorSettings.snowElevation01);
        this.surfaceMaterial.setFloat("snowOffsetAmplitude", this.colorSettings.snowOffsetAmplitude);
        this.surfaceMaterial.setFloat("snowLacunarity", this.colorSettings.snowLacunarity);
        this.surfaceMaterial.setFloat("snowLatitudePersistence", this.colorSettings.snowLatitudePersistence);
        this.surfaceMaterial.setFloat("steepSnowDotLimit", this.colorSettings.steepSnowDotLimit);

        this.surfaceMaterial.setFloat("minTemperature", this._physicalProperties.minTemperature);
        this.surfaceMaterial.setFloat("maxTemperature", this._physicalProperties.maxTemperature);

        this.surfaceMaterial.setFloat("waterAmount", this._physicalProperties.waterAmount);

    }

    public update(observerPosition: BABYLON.Vector3, observerDirection: BABYLON.Vector3, lightPosition: BABYLON.Vector3) {
        this.surfaceMaterial.setVector3("playerPosition", observerPosition);
        this.surfaceMaterial.setVector3("sunPosition", lightPosition);
        this.surfaceMaterial.setVector3("planetPosition", this.attachNode.absolutePosition);

        this.surfaceMaterial.setMatrix("planetWorldMatrix", this.attachNode.getWorldMatrix());
        this.updateLOD(observerPosition, observerDirection);
    }
    public getRelativePosition() {
        return this.attachNode.position;
    }
    public getAbsolutePosition() {
        return this.attachNode.getAbsolutePosition();
    }
}