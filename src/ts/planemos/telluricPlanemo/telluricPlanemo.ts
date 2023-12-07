import { Direction } from "../../utils/direction";

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Axis } from "@babylonjs/core/Maths/math.axis";

import { AbstractController } from "../../uberCore/abstractController";
import { TelluricPlanemoMaterial } from "./telluricPlanemoMaterial";
import { waterBoilingPointCelsius } from "../../utils/waterMechanics";
import { AbstractBody } from "../../bodies/abstractBody";
import { UberScene } from "../../uberCore/uberScene";
import { Planemo, PlanemoMaterial } from "../planemo";
import { TelluricPlanemoModel } from "./telluricPlanemoModel";
import { StellarObject } from "../../stellarObjects/stellarObject";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { ChunkTree } from "./terrain/chunks/chunkTree";
import { ChunkForge } from "./terrain/chunks/chunkForge";
import { PhysicsShapeSphere } from "@babylonjs/core/Physics/v2/physicsShape";
import { Transformable } from "../../uberCore/transforms/basicTransform";

export class TelluricPlanemo extends AbstractBody implements Planemo, PlanemoMaterial {
    readonly sides: ChunkTree[]; // stores the 6 sides of the sphere

    readonly material: TelluricPlanemoMaterial;

    readonly model: TelluricPlanemoModel;

    /**
     * New Telluric Planet
     * @param name The name of the planet
     * @param scene
     * @param model The model to build the planet or a seed for the planet in [-1, 1]
     * @param parentBody
     */
    constructor(name: string, scene: UberScene, model: TelluricPlanemoModel | number, parentBody?: AbstractBody) {
        super(name, scene, parentBody);

        this.model = model instanceof TelluricPlanemoModel ? model : new TelluricPlanemoModel(model, parentBody?.model);

        this.getTransform().rotate(Axis.X, this.model.physicalProperties.axialTilt);

        this.postProcesses.push(PostProcessType.SHADOW);

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

        if (this.model.ringsUniforms !== null) this.postProcesses.push(PostProcessType.RING);

        this.material = new TelluricPlanemoMaterial(this.name, this.getTransform(), this.model, scene);

        const physicsShape = new PhysicsShapeSphere(Vector3.Zero(), this.model.radius, scene);
        this.aggregate.shape.addChildFromParent(this.getTransform(), physicsShape, this.getTransform());

        this.sides = [
            new ChunkTree(Direction.Up, this.name, this.model, this.aggregate, this.material, scene),
            new ChunkTree(Direction.Down, this.name, this.model, this.aggregate, this.material, scene),
            new ChunkTree(Direction.Forward, this.name, this.model, this.aggregate, this.material, scene),
            new ChunkTree(Direction.Backward, this.name, this.model, this.aggregate, this.material, scene),
            new ChunkTree(Direction.Right, this.name, this.model, this.aggregate, this.material, scene),
            new ChunkTree(Direction.Left, this.name, this.model, this.aggregate, this.material, scene)
        ];

        for (const side of this.sides) {
            side.onChunkPhysicsShapeDeletedObservable.add((index) => {
                for (const side2 of this.sides) {
                    side2.registerPhysicsShapeDeletion(index);
                }
            });
        }
    }

    getTypeName(): string {
        return "Telluric Planemo";
    }

    /**
     * Update terrain of the sphere relative to the observer position
     * @param observerPosition
     * @param chunkForge
     */
    public updateLOD(observerPosition: Vector3, chunkForge: ChunkForge): void {
        for (const side of this.sides) side.update(observerPosition, chunkForge);
    }

    public updateMaterial(controller: AbstractController, stellarObjects: Transformable[], deltaTime: number): void {
        this.material.update(controller.getTransform().getAbsolutePosition(), stellarObjects);
    }

    public override getBoundingRadius(): number {
        return super.getRadius() + this.model.physicalProperties.oceanLevel;
    }

    public override computeCulling(camera: Camera): void {
        for (const side of this.sides) side.computeCulling(camera);
    }

    public override dispose(): void {
        this.material.dispose();
        for (const side of this.sides) side.dispose();
        this.aggregate.dispose();
        super.dispose();
    }
}
