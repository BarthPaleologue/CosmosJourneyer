import { ChunkTree } from "../../../controller/chunks/chunkTree";
import { Direction } from "../../../utils/direction";

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Axis } from "@babylonjs/core/Maths/math.axis";

import { TransferCollisionData } from "../../../controller/chunks/workerDataTypes";
import { TaskType } from "../../../controller/chunks/taskTypes";
import { AbstractController } from "../../../controller/uberCore/abstractController";
import { TelluricPlanemoMaterial } from "../../materials/telluricPlanemoMaterial";
import { waterBoilingPointCelsius } from "../../../utils/waterMechanics";
import { AbstractBody } from "../abstractBody";
import { UberScene } from "../../../controller/uberCore/uberScene";
import { Planemo } from "./planemo";
import { TelluricPlanemoModel } from "../../../model/planemos/telluricPlanemoModel";
import { StellarObject } from "../stellarObjects/stellarObject";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { RigidBody } from "../../../controller/workers/rigidbody";

export class TelluricPlanemo extends AbstractBody implements RigidBody, Planemo {
    readonly sides: ChunkTree[] = new Array(6); // stores the 6 sides of the sphere

    readonly material: TelluricPlanemoMaterial;

    readonly model: TelluricPlanemoModel;

    /**
     * New Telluric Planet
     * @param name The name of the planet
     * @param scene
     * @param parentBodies The bodies the planet is orbiting
     * @param model The model to build the planet or a seed for the planet in [-1, 1]
     */
    constructor(name: string, scene: UberScene, parentBodies: AbstractBody[], model: TelluricPlanemoModel | number) {
        super(name, parentBodies, scene);

        this.model =
            model instanceof TelluricPlanemoModel
                ? model
                : new TelluricPlanemoModel(
                      model,
                      parentBodies.map((body) => body.model)
                  );

        this.transform.rotate(Axis.X, this.model.physicalProperties.axialTilt);

        this.postProcesses.push(PostProcessType.OVERLAY);

        const waterBoilingPoint = waterBoilingPointCelsius(this.model.physicalProperties.pressure);
        const waterFreezingPoint = 0.0;
        const epsilon = 0.05;
        if (this.model.physicalProperties.pressure > epsilon) {
            if (waterFreezingPoint > this.model.physicalProperties.minTemperature && waterFreezingPoint < this.model.physicalProperties.maxTemperature) {
                this.postProcesses.push(PostProcessType.OCEAN);
                this.postProcesses.push(PostProcessType.CLOUDS);
            } else {
                this.model.physicalProperties.oceanLevel = 0;
            }
            this.postProcesses.push(PostProcessType.ATMOSPHERE);
        } else {
            this.model.physicalProperties.oceanLevel = 0;
        }

        if (this.model.hasRings) this.postProcesses.push(PostProcessType.RING);

        this.material = new TelluricPlanemoMaterial(this.name, this.transform, this.model, scene);

        this.sides = [
            new ChunkTree(Direction.Up, this.name, this.model, this.transform, this.material, scene),
            new ChunkTree(Direction.Down, this.name, this.model, this.transform, this.material, scene),
            new ChunkTree(Direction.Forward, this.name, this.model, this.transform, this.material, scene),
            new ChunkTree(Direction.Backward, this.name, this.model, this.transform, this.material, scene),
            new ChunkTree(Direction.Right, this.name, this.model, this.transform, this.material, scene),
            new ChunkTree(Direction.Left, this.name, this.model, this.transform, this.material, scene)
        ];
    }

    public generateCollisionTask(relativePosition: Vector3): TransferCollisionData {
        const collisionData: TransferCollisionData = {
            seed: this.model.seed,
            taskType: TaskType.Collision,
            planetName: this.name,
            terrainSettings: this.model.terrainSettings,
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
        this.material.update(controller.transform.getAbsolutePosition(), stellarObjects.map((star) => star.transform.getAbsolutePosition()));
    }

    public override getBoundingRadius(): number {
        return super.getRadius() + this.model.physicalProperties.oceanLevel;
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
