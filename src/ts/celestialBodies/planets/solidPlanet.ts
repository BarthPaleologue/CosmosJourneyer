import {ChunkTree} from "../../forge/chunkTree";
import {Direction} from "../../utils/direction";
import {TerrainSettings} from "../../terrain/terrainSettings";
import {AbstractPlanet} from "./abstractPlanet";

import {
    Vector3,
    Mesh,
    Scene,
    ShaderMaterial,
    Axis,
    Space,
    Texture,
    Quaternion,
    Matrix,
    MaterialHelper, Color3
} from "@babylonjs/core";

import bottomNormalMap from "../../../asset/textures/crackednormal.jpg";
import steepNormalMap from "../../../asset/textures/rockn.png";
import grassNormalMap from "../../../asset/textures/grassNormalMap.jpg";

import snowNormalMap from "../../../asset/textures/snowNormalMap.png";
import snowNormalMap2 from "../../../asset/textures/snowNormalMap2.png";

import beachNormalMap from "../../../asset/textures/sandNormalMap2.png";
import desertNormalMap from "../../../asset/textures/sandNormalMap2.jpg";

import {CelestialBodyType, RigidBody, SolidPhysicalProperties} from "../interfaces";
import {CollisionData} from "../../forge/workerDataInterfaces";
import {TaskType} from "../../forge/taskInterfaces";
import {initMeshTransform} from "../../utils/mesh";
import {PlayerController} from "../../player/playerController";
import {StarSystemManager} from "../starSystemManager";
import {Settings} from "../../settings";

export enum ColorMode {
    DEFAULT,
    MOISTURE,
    TEMPERATURE,
    NORMAL,
    HEIGHT
}

export interface ColorSettings {
    mode: number;

    snowColor: Color3;
    steepColor: Color3;
    plainColor: Color3;
    beachColor: Color3;
    desertColor: Color3;
    bottomColor: Color3;

    beachSize: number;
    steepSharpness: number;
    normalSharpness: number;
}


export class SolidPlanet extends AbstractPlanet implements RigidBody {

    public colorSettings: ColorSettings;

    readonly oceanLevel: number;

    override readonly physicalProperties: SolidPhysicalProperties;

    protected bodyType = CelestialBodyType.SOLID;

    public terrainSettings: TerrainSettings;

    private internalTime = 0;

    readonly attachNode: Mesh; // reprensents the center of the sphere
    readonly sides: ChunkTree[] = new Array(6); // stores the 6 sides of the sphere

    surfaceMaterial: ShaderMaterial;

    constructor(id: string, radius: number,
                starSystemManager: StarSystemManager, scene: Scene,
                physicalProperties: SolidPhysicalProperties = {
                    rotationPeriod: 60 * 60 * 24,
                    rotationAxis: Axis.Y,
                    minTemperature: -60,
                    maxTemperature: 40,
                    pressure: 1,
                    waterAmount: 1
                }, seed = [0, 0, 0]) {
        super(id, radius, starSystemManager, seed);

        this.physicalProperties = physicalProperties;

        // TODO: faire quelque chose de réaliste
        this.oceanLevel = Settings.OCEAN_DEPTH * this.physicalProperties.waterAmount * this.physicalProperties.pressure;

        this.attachNode = new Mesh(`${this._name}AttachNode`, scene);

        initMeshTransform(this.attachNode);

        this.terrainSettings = {
            continentsFragmentation: 0.47,

            bumpsFrequency: 3e-5,

            maxBumpHeight: 1.5e3,
            maxMountainHeight: 20e3,
            continentBaseHeight: 5e3,

            mountainsFrequency: 10e-6,
            mountainsMinValue: 0.5
        };

        this.colorSettings = {
            mode: ColorMode.DEFAULT,

            snowColor: new Color3(1, 1, 1),
            steepColor: new Color3(55, 42, 42).scale(1 / 255),
            plainColor: new Color3(56, 94, 6).scale(1 / 255),
            beachColor: new Color3(0.7, 0.7, 0.2),
            desertColor: new Color3(178, 107, 42).scale(1 / 255),
            bottomColor: new Color3(0.5, 0.5, 0.5),

            beachSize: 300,
            steepSharpness: 2,
            normalSharpness: 0.5,
        };


        // TODO: make a class for that monster
        let surfaceMaterial = new ShaderMaterial("surfaceColor", scene, "./shaders/surfaceColor",
            {
                attributes: ["position", "normal", "uv"],
                uniforms: [
                    "world", "worldViewProjection", "projection", "view",

                    "textureSampler", "depthSampler",

                    "colorMode",

                    "bottomNormalMap",
                    "plainNormalMap", "beachNormalMap", "desertNormalMap",
                    "snowNormalMap", "snowNormalMap2",
                    "steepNormalMap",

                    "seed",

                    "cameraNear", "cameraFar", "planetPosition", "planetRadius",

                    "planetRotationAxis", "rotationTheta",

                    "playerPosition",

                    "waterLevel", "beachSize", "steepSharpness", "normalSharpness",

                    "snowColor", "steepColor", "plainColor", "beachColor", "desertColor", "bottomColor",

                    "maxElevation",

                    "minTemperature", "maxTemperature", "pressure",

                    "waterAmount",

                    "logarithmicDepthConstant"
                ],
                defines: ["#define LOGARITHMICDEPTH"]
            }
        );

        surfaceMaterial.onBindObservable.add(() => {
            let effect = surfaceMaterial.getEffect();
            MaterialHelper.BindLogDepth(null, effect, scene);
        });

        surfaceMaterial.setVector3("seed", new Vector3(this._seed[0], this._seed[1], this._seed[2]));

        surfaceMaterial.setTexture("bottomNormalMap", new Texture(bottomNormalMap, scene));
        surfaceMaterial.setTexture("steepNormalMap", new Texture(steepNormalMap, scene));
        surfaceMaterial.setTexture("plainNormalMap", new Texture(grassNormalMap, scene));

        surfaceMaterial.setTexture("snowNormalMap", new Texture(snowNormalMap, scene));
        surfaceMaterial.setTexture("snowNormalMap2", new Texture(snowNormalMap2, scene));

        surfaceMaterial.setTexture("beachNormalMap", new Texture(beachNormalMap, scene));
        surfaceMaterial.setTexture("desertNormalMap", new Texture(desertNormalMap, scene));

        surfaceMaterial.setVector3("playerPosition", Vector3.Zero());
        surfaceMaterial.setVector3("sunPosition", Vector3.Zero());
        surfaceMaterial.setVector3("planetPosition", this.attachNode.absolutePosition);
        surfaceMaterial.setFloat("planetRadius", this._radius);

        surfaceMaterial.setFloat("normalSharpness", this.colorSettings.normalSharpness);

        // TODO: déharcoder le bouzin
        surfaceMaterial.setFloat("maxElevation", this.terrainSettings.continentBaseHeight + this.terrainSettings.maxMountainHeight + this.terrainSettings.maxBumpHeight);

        this.surfaceMaterial = surfaceMaterial;

        this.sides = [
            new ChunkTree(Direction.Up, this),
            new ChunkTree(Direction.Down, this),
            new ChunkTree(Direction.Forward, this),
            new ChunkTree(Direction.Backward, this),
            new ChunkTree(Direction.Right, this),
            new ChunkTree(Direction.Left, this)
        ];

        this.updateMaterial();
    }

    public generateCollisionTask(relativePosition: Vector3): CollisionData {
        let collisionData: CollisionData = {
            taskType: TaskType.Collision,
            planetName: this._name,
            terrainSettings: this.terrainSettings,
            position: [
                relativePosition.x,
                relativePosition.y,
                relativePosition.z
            ],
            planetDiameter: this.getDiameter()
        }
        return collisionData;
    }

    public override getWorldMatrix(): Matrix {
        return this.attachNode.getWorldMatrix();
    }

    /**
     * Update terrain of the sphere relative to the observer position
     * @param observerPosition
     */
    private updateLOD(observerPosition: Vector3): void {
        for (const side of this.sides) side.update(observerPosition);
    }

    /**
     * Regenerates the chunks
     */
    public reset(): void {
        for (const side of this.sides) side.reset();
    }

    /**
     * Updates surfaceMaterial with its new values
     */
    public updateMaterial(): void {
        //TODO: when the code is robust enough, get rid of this method
        this.surfaceMaterial.setInt("colorMode", this.colorSettings.mode);

        this.surfaceMaterial.setFloat("waterLevel", this.oceanLevel);
        this.surfaceMaterial.setFloat("beachSize", this.colorSettings.beachSize);
        this.surfaceMaterial.setFloat("steepSharpness", this.colorSettings.steepSharpness);

        this.surfaceMaterial.setColor3("snowColor", this.colorSettings.snowColor);
        this.surfaceMaterial.setColor3("steepColor", this.colorSettings.steepColor);
        this.surfaceMaterial.setColor3("plainColor", this.colorSettings.plainColor);
        this.surfaceMaterial.setColor3("beachColor", this.colorSettings.beachColor);
        this.surfaceMaterial.setColor3("desertColor", this.colorSettings.desertColor);
        this.surfaceMaterial.setColor3("bottomColor", this.colorSettings.bottomColor);

        this.surfaceMaterial.setFloat("normalSharpness", this.colorSettings.normalSharpness);

        this.surfaceMaterial.setFloat("minTemperature", this.physicalProperties.minTemperature);
        this.surfaceMaterial.setFloat("maxTemperature", this.physicalProperties.maxTemperature);
        this.surfaceMaterial.setFloat("pressure", this.physicalProperties.pressure);
        this.surfaceMaterial.setFloat("waterAmount", this.physicalProperties.waterAmount);

    }

    public update(player: PlayerController, starPosition: Vector3, deltaTime: number) {
        super.update(player, starPosition, deltaTime);

        this.internalTime += deltaTime;

        this.surfaceMaterial.setVector3("playerPosition", player.getAbsolutePosition());
        this.surfaceMaterial.setVector3("sunPosition", starPosition);

        this.surfaceMaterial.setVector3("planetPosition", this.getAbsolutePosition());

        this.surfaceMaterial.setVector3("planetRotationAxis", this.physicalProperties.rotationAxis);
        this.surfaceMaterial.setFloat("rotationTheta", (this.internalTime / this.physicalProperties.rotationPeriod) % (2 * Math.PI));

        this.updateLOD(player.getAbsolutePosition());
    }

    public getRelativePosition() {
        return this.attachNode.position.clone();
    }

    public getAbsolutePosition() {
        return this.attachNode.getAbsolutePosition();
    }

    public override getApparentRadius(): number {
        return super.getRadius() + this.oceanLevel;
    }

    setAbsolutePosition(newPosition: Vector3): void {
        this.attachNode.setAbsolutePosition(newPosition);
    }

    getRotationQuaternion(): Quaternion {
        return this.attachNode.rotationQuaternion!;
    }

    public translate(displacement: Vector3): void {
        this.attachNode.position.addInPlace(displacement);
    }

    public rotateAround(pivot: Vector3, axis: Vector3, amount: number): void {
        this.attachNode.rotateAround(pivot, axis, amount);
    }

    public rotate(axis: Vector3, amount: number) {
        this.attachNode.rotate(axis, amount, Space.WORLD);
        super.rotate(axis, amount);
    }
}