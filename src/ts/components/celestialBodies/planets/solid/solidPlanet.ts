import { Crater, generateCraters } from "../../../terrain/crater/crater";
import { ChunkForge } from "../../../forge/chunkForge";
import { PlanetSide } from "./planetSide";
import { Direction } from "../../../toolbox/direction";
import { TerrainSettings } from "../../../terrain/terrainSettings";
import { PlanetPhysicalProperties, AbstractPlanet } from "../abstractPlanet";
import {CelestialBodyType} from "../../celestialBody";

import {Vector3, Mesh, Scene, ShaderMaterial, Axis, Space, Texture, Quaternion} from "@babylonjs/core";

//texture import
import crackednormal from "../../../../../asset/textures/crackednormal.jpg";
import rockn from "../../../../../asset/textures/rockn.png";
import grassn from "../../../../../asset/textures/grassn.png";

import snowNormalMap from "../../../../../asset/textures/snowNormalMap3.jpg";
import snowNormalMap2 from "../../../../../asset/textures/snowNormalMap2.png";

import sandNormalMap from "../../../../../asset/textures/sandNormalMap.jpg";


export interface ColorSettings {
    snowColor: Vector3,
    steepColor: Vector3,
    plainColor: Vector3,
    sandColor: Vector3,

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

export interface SolidPhysicalProperties extends PlanetPhysicalProperties {
    waterAmount: number;
}

export class SolidPlanet extends AbstractPlanet {

    craters: Crater[];

    public colorSettings: ColorSettings;
    readonly physicalProperties: SolidPhysicalProperties;

    protected bodyType = CelestialBodyType.SOLID;

    public terrainSettings: TerrainSettings;

    readonly rootChunkLength: number; // length of eachChunk

    readonly maxDepth: number;

    readonly attachNode: Mesh; // reprensents the center of the sphere
    readonly sides: PlanetSide[] = new Array(6); // stores the 6 sides of the sphere

    surfaceMaterial: ShaderMaterial;

    constructor(id: string, radius: number, position: Vector3, minDepth: number, scene: Scene, physicalProperties: SolidPhysicalProperties = {
        minTemperature: -40,
        maxTemperature: 50,
        pressure: 1,
        waterAmount: 1
    }, seed = [0, 0, 0]) {
        super(id, radius, seed);

        this.physicalProperties = physicalProperties;

        this.rootChunkLength = this._radius * 2;

        this.maxDepth = Math.round(Math.log2(radius) - 12);

        let spaceBetweenVertex = this.rootChunkLength / (64 * 2 ** this.maxDepth);
        console.log(spaceBetweenVertex);

        this.attachNode = Mesh.CreateBox(`${this._name}AttachNode`, 1, scene);
        this.attachNode.rotate(Axis.Y, 0, Space.WORLD); // init rotation quaternion
        this.attachNode.position = position;

        /*let nbCraters = 800;
        let craterRadiusFactor = 1;
        let craterSteepnessFactor = 1;
        let craterMaxDepthFactor = 1;*/

        this.terrainSettings = {
            continentsFragmentation: 0.47,
            continentBaseHeight: 5e3,

            maxBumpHeight: 1.5e3,
            bumpsFrequency: 3e-5,

            maxMountainHeight: 15e3,
            mountainsFrequency: 9e-6,
            mountainsMinValue: 0.6
        };

        this.colorSettings = {
            snowColor: new Vector3(1, 1, 1),
            steepColor: new Vector3(55, 42, 42).scale(1 / 255),
            plainColor: new Vector3(0.5, 0.3, 0.08),
            sandColor: new Vector3(0.7, 0.7, 0.2),

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

        let surfaceMaterial = new ShaderMaterial("surfaceColor", scene, "./shaders/surfaceColor",
            {
                attributes: ["position", "normal", "uv"],
                uniforms: [
                    "world", "worldViewProjection", "projection", "view",

                    "textureSampler", "depthSampler",

                    "bottomNormalMap", "plainNormalMap", "sandNormalMap",
                    "snowNormalMap", "snowNormalMap2",
                    "steepNormalMap",

                    "seed",

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

        surfaceMaterial.setVector3("seed", new Vector3(this._seed[0], this._seed[1], this._seed[2]));

        surfaceMaterial.setTexture("bottomNormalMap", new Texture(crackednormal, scene));
        surfaceMaterial.setTexture("steepNormalMap", new Texture(rockn, scene));
        surfaceMaterial.setTexture("plainNormalMap", new Texture(grassn, scene));

        surfaceMaterial.setTexture("snowNormalMap", new Texture(snowNormalMap, scene));
        surfaceMaterial.setTexture("snowNormalMap2", new Texture(snowNormalMap2, scene));

        surfaceMaterial.setTexture("sandNormalMap", new Texture(sandNormalMap, scene));

        surfaceMaterial.setVector3("playerPosition", Vector3.Zero());
        surfaceMaterial.setVector3("sunPosition", Vector3.Zero());
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

        surfaceMaterial.setFloat("minTemperature", this.physicalProperties.minTemperature);
        surfaceMaterial.setFloat("maxTemperature", this.physicalProperties.maxTemperature);

        surfaceMaterial.setFloat("waterAmount", this.physicalProperties.waterAmount);

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
     * @param observerPosition
     * @param observerDirection
     */
    private updateLOD(observerPosition: Vector3, observerDirection: Vector3): void {
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

        this.surfaceMaterial.setFloat("minTemperature", this.physicalProperties.minTemperature);
        this.surfaceMaterial.setFloat("maxTemperature", this.physicalProperties.maxTemperature);

        this.surfaceMaterial.setFloat("waterAmount", this.physicalProperties.waterAmount);

    }

    public update(observerPosition: Vector3, observerDirection: Vector3, lightPosition: Vector3) {
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

    setAbsolutePosition(newPosition: Vector3): void {
        this.attachNode.setAbsolutePosition(newPosition);
    }

    getRotationQuaternion(): Quaternion {
        return this.attachNode.rotationQuaternion!;
    }
}