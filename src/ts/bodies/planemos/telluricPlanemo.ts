import { ChunkTree } from "../../chunks/chunkTree";
import { Direction } from "../../utils/direction";

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Axis } from "@babylonjs/core/Maths/math.axis";

import { TransferCollisionData } from "../../chunks/workerDataTypes";
import { TaskType } from "../../chunks/taskTypes";
import { AbstractController } from "../../uberCore/abstractController";
import { TelluricPlanemoMaterial } from "../../materials/telluricPlanemoMaterial";
import { waterBoilingPointCelsius } from "../../utils/waterMechanics";
import { AbstractBody } from "../abstractBody";
import { UberScene } from "../../uberCore/uberScene";
import { Planemo } from "./planemo";
import { TelluricPlanemoDescriptor } from "../../descriptors/planemos/telluricPlanemoDescriptor";
import { StellarObject } from "../stellarObjects/stellarObject";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { RigidBody } from "../../workers/rigidbody";

export class TelluricPlanemo extends AbstractBody implements RigidBody, Planemo {
    override readonly postProcesses: PostProcessType[] = [];

    readonly sides: ChunkTree[] = new Array(6); // stores the 6 sides of the sphere

    readonly material: TelluricPlanemoMaterial;

    readonly descriptor: TelluricPlanemoDescriptor;

    /**
     * New Telluric Planet
     * @param name The name of the planet
     * @param scene
     * @param seed The seed of the planet in [-1, 1]
     * @param parentBodies The bodies the planet is orbiting
     */
    constructor(name: string, scene: UberScene, seed: number, parentBodies: AbstractBody[]) {
        super(name, parentBodies, scene);

        this.descriptor = new TelluricPlanemoDescriptor(
            seed,
            parentBodies.map((body) => body.descriptor)
        );

        this.transform.rotate(Axis.X, this.descriptor.physicalProperties.axialTilt);

        this.postProcesses.push(PostProcessType.OVERLAY);

        const waterBoilingPoint = waterBoilingPointCelsius(this.descriptor.physicalProperties.pressure);
        const waterFreezingPoint = 0.0;
        const epsilon = 0.05;
        if (this.descriptor.physicalProperties.pressure > epsilon) {
            if (waterFreezingPoint > this.descriptor.physicalProperties.minTemperature && waterFreezingPoint < this.descriptor.physicalProperties.maxTemperature) {
                this.postProcesses.push(PostProcessType.OCEAN);
                this.postProcesses.push(PostProcessType.CLOUDS);
            } else {
                this.descriptor.physicalProperties.oceanLevel = 0;
            }
            this.postProcesses.push(PostProcessType.ATMOSPHERE);
        } else {
            this.descriptor.physicalProperties.oceanLevel = 0;
        }

        if (this.descriptor.hasRings) this.postProcesses.push(PostProcessType.RING);

        this.material = new TelluricPlanemoMaterial(this.name, this.transform, this.descriptor, scene);

        this.sides = [
            new ChunkTree(Direction.Up, this.name, this.descriptor, this.transform, this.material, scene),
            new ChunkTree(Direction.Down, this.name, this.descriptor, this.transform, this.material, scene),
            new ChunkTree(Direction.Forward, this.name, this.descriptor, this.transform, this.material, scene),
            new ChunkTree(Direction.Backward, this.name, this.descriptor, this.transform, this.material, scene),
            new ChunkTree(Direction.Right, this.name, this.descriptor, this.transform, this.material, scene),
            new ChunkTree(Direction.Left, this.name, this.descriptor, this.transform, this.material, scene)
        ];
    }

    public generateCollisionTask(relativePosition: Vector3): TransferCollisionData {
        const collisionData: TransferCollisionData = {
            seed: this.descriptor.seed,
            taskType: TaskType.Collision,
            planetName: this.name,
            terrainSettings: this.descriptor.terrainSettings,
            position: [relativePosition.x, relativePosition.y, relativePosition.z],
            planetDiameter: this.getDiameter()
        };
        return collisionData;
    }

    /**
     * Update terrain of the sphere relative to the observer position
     * @param observerPosition
     */
    public updateLOD(observerPosition: Vector3): void {
        for (const side of this.sides) side.update(observerPosition);
    }

    /**
     * Regenerates the chunks
     */
    public reset(): void {
        for (const side of this.sides) side.reset();
    }

    public updateMaterial(controller: AbstractController, stellarObjects: StellarObject[], deltaTime: number): void {
        this.material.update(controller, stellarObjects);
    }

    public override getBoundingRadius(): number {
        return super.getRadius() + this.descriptor.physicalProperties.oceanLevel;
    }

    public override computeCulling(cameraPosition: Vector3): void {
        for (const side of this.sides) side.computeCulling(cameraPosition);
    }

    public override dispose(): void {
        this.material.dispose();
        for (const side of this.sides) side.dispose();
        super.dispose();
    }
}
