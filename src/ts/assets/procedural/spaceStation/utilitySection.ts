import { Scene } from "@babylonjs/core/scene";
import { Transformable } from "../../../architecture/transformable";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Objects } from "../../objects";
import { MetalSectionMaterial } from "./metalSectionMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { AbstractMesh, PhysicsAggregate, PhysicsShapeType } from "@babylonjs/core";
import { CollisionMask } from "../../../settings";

export class UtilitySection implements Transformable {
    private readonly attachment: Mesh;

    private readonly attachmentAggregate: PhysicsAggregate;

    private readonly metalSectionMaterial: MetalSectionMaterial;

    private readonly tanks: AbstractMesh[] = [];
    private readonly tankAggregates: PhysicsAggregate[] = [];

    constructor(scene: Scene) {
        this.metalSectionMaterial = new MetalSectionMaterial(scene);

        this.attachment = MeshBuilder.CreateCylinder("UtilitySectionRoot", {
            height: 700,
            diameter: 100,
            tessellation: 6
        }, scene);
        this.attachment.convertToFlatShadedMesh();
        this.attachment.material = this.metalSectionMaterial;

        this.attachmentAggregate = new PhysicsAggregate(this.attachment, PhysicsShapeType.MESH, { mass: 0 });
        this.attachmentAggregate.body.disablePreStep = false;
        this.attachmentAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
        this.attachmentAggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;

        const boundingVectors = this.attachment.getHierarchyBoundingVectors();
        const boundingExtendSize = boundingVectors.max.subtract(boundingVectors.min).scale(0.5);

        if(Math.random() < 0.3) {
            for (let ring = -3; ring <= 3; ring++) {
                for (let sideIndex = 0; sideIndex < 6; sideIndex++) {
                    const tank = Objects.SPHERICAL_TANK.createInstance("SphericalTank");
                    tank.scalingDeterminant = 2.4;

                    const newBoundingVectors = tank.getHierarchyBoundingVectors();
                    const newBoundingExtendSize = newBoundingVectors.max.subtract(newBoundingVectors.min).scale(0.5);

                    tank.position.x = boundingExtendSize.x + newBoundingExtendSize.x;
                    tank.parent = this.getTransform();

                    tank.rotateAround(Vector3.Zero(), Axis.Y, Math.PI / 6 + (Math.PI / 3) * sideIndex);
                    tank.translate(Axis.Y, ring * 40);

                    this.tanks.push(tank);

                    const tankAggregate = new PhysicsAggregate(tank, PhysicsShapeType.SPHERE, { mass: 0 });
                    tankAggregate.body.disablePreStep = false;
                    tankAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
                    tankAggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;

                    this.tankAggregates.push(tankAggregate);
                }
            }
        }
    }

    update(stellarObjects: Transformable[]) {
        this.metalSectionMaterial.update(stellarObjects);
    }

    getTransform(): TransformNode {
        return this.attachment;
    }

    dispose() {
        this.attachment.dispose();
        this.attachmentAggregate.dispose();
        this.metalSectionMaterial.dispose();
        this.tanks.forEach(tank => tank.dispose());
        this.tankAggregates.forEach(tankAggregate => tankAggregate.dispose());
    }
}
