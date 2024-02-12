import { TransformNode } from "@babylonjs/core/Meshes";
import { Assets } from "../assets";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsShapeConvexHull } from "@babylonjs/core/Physics/v2/physicsShape";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { CollisionMask } from "../settings";
import { Scene } from "@babylonjs/core/scene";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math";
import { Transformable } from "../architecture/transformable";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { PhysicsMotionType } from "@babylonjs/core";
import { Axis } from "@babylonjs/core/Maths/math.axis";

export class LandingPad implements Transformable {
    readonly instanceRoot: TransformNode;

    //readonly aggregate: PhysicsAggregate;

    constructor(scene: Scene, existingMesh: AbstractMesh | null = null) {
        if (existingMesh === null) {
            this.instanceRoot = Assets.CreateLandingPadInstance();
        } else {
            this.instanceRoot = existingMesh;
        }

        // init rotation quaternion
        this.instanceRoot.rotate(Axis.X, 0);

        /*this.aggregate = new PhysicsAggregate(
            this.instanceRoot,
            PhysicsShapeType.CONTAINER,
            {
                mass: 0,
                restitution: 0.2
            },
            scene
        );

        this.aggregate.body.setMotionType(PhysicsMotionType.STATIC);

        this.aggregate.body.setMassProperties({ inertia: Vector3.Zero(), mass: 0 });

        for (const child of this.instanceRoot.getChildMeshes()) {
            const childShape = new PhysicsShapeConvexHull(child as Mesh, scene);
            childShape.filterMembershipMask = CollisionMask.LANDING_PADS;
            this.aggregate.shape.addChildFromParent(this.instanceRoot, childShape, child);
        }
        this.aggregate.body.disablePreStep = false;*/
    }

    getTransform(): TransformNode {
        return this.instanceRoot;
    }

    dispose() {
        //this.aggregate.dispose();
        this.instanceRoot.dispose();
    }
}
