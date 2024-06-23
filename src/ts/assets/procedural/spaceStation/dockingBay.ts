import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { RingHabitatMaterial } from "./ringHabitatMaterial";
import { MetalSectionMaterial } from "./metalSectionMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Scene } from "@babylonjs/core/scene";
import { Axis, PhysicsShapeType } from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { createTube } from "../../../utils/tubeBuilder";
import { Transformable } from "../../../architecture/transformable";
import { computeRingRotationPeriod } from "../../../utils/ringRotation";
import { CollisionMask, Settings } from "../../../settings";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Space } from "@babylonjs/core/Maths/math.axis";
import { LandingPad } from "../landingPad/landingPad";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";

export class DockingBay {
    private readonly root: TransformNode;

    private readonly radius: number;

    private readonly ringMaterial: RingHabitatMaterial;
    private readonly metalSectionMaterial: MetalSectionMaterial;

    private readonly ring: Mesh;
    private readonly ringAggregate: PhysicsAggregate;

    private readonly arms: Mesh[] = [];
    private readonly armAggregates: PhysicsAggregate[] = [];

    readonly landingPads: LandingPad[] = [];

    constructor(scene: Scene) {
        this.root = new TransformNode("DockingBayRoot", scene);

        this.radius = 500;

        const deltaRadius = this.radius / 3;

        this.metalSectionMaterial = new MetalSectionMaterial(scene);

        const heightFactor = 2 + Math.floor(Math.random() * 2);

        const circumference = 2 * Math.PI * this.radius;

        const path: Vector3[] = [];
        const nbSteps = circumference / deltaRadius;
        for (let i = 0; i <= nbSteps + 1; i++) {
            const theta = (2 * Math.PI * i) / nbSteps;
            path.push(new Vector3(this.radius * Math.sin(theta), 0, this.radius * Math.cos(theta)));
        }

        this.ring = createTube(
            "DockingBay",
            {
                path: path,
                radius: (Math.sqrt(2) * deltaRadius) / 2,
                tessellation: 4
            },
            scene
        );
        this.ring.scaling.y = heightFactor;
        this.ring.bakeCurrentTransformIntoVertices();
        this.ring.convertToFlatShadedMesh();

        this.ringMaterial = new RingHabitatMaterial(circumference, deltaRadius, heightFactor, scene);
        this.ring.material = this.ringMaterial;

        this.ring.parent = this.getTransform();

        this.ringAggregate = new PhysicsAggregate(this.ring, PhysicsShapeType.MESH, { mass: 0 });
        this.ringAggregate.body.disablePreStep = false;
        this.ringAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
        this.ringAggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;

        const yExtent = this.ring.getBoundingInfo().boundingBox.extendSize.y;

        const nbArms = 6;
        for (let i = 0; i <= nbArms; i++) {
            const armDiameter = deltaRadius / 4;
            const arm = MeshBuilder.CreateCylinder(
                `RingHabitatArm${i}`,
                {
                    height: 2 * this.radius,
                    diameter: armDiameter,
                    tessellation: 4
                },
                scene
            );
            arm.convertToFlatShadedMesh();
            arm.rotate(Axis.Z, Math.PI / 2, Space.LOCAL);
            arm.material = this.metalSectionMaterial;

            const theta = (i / nbArms) * Math.PI * 2;

            arm.rotate(Axis.Y, theta, Space.WORLD);

            arm.translate(Axis.Y, -yExtent + armDiameter / 2, Space.WORLD);

            arm.parent = this.getTransform();

            this.arms.push(arm);

            const armAggregate = new PhysicsAggregate(arm, PhysicsShapeType.BOX, { mass: 0 });
            armAggregate.body.disablePreStep = false;
            armAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
            armAggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;

            this.armAggregates.push(armAggregate);
        }

        const nbPads = nbSteps;
        let padNumber = 0;
        for (let i = 0; i < nbPads; i++) {
            const landingPad = new LandingPad(padNumber++, scene);
            landingPad.getTransform().parent = this.getTransform();

            landingPad.getTransform().rotate(Axis.Z, Math.PI / 2, Space.LOCAL);

            landingPad.getTransform().rotate(Axis.X, ((i + 0.5) * 2.0 * Math.PI) / nbPads, Space.LOCAL);

            landingPad.getTransform().rotate(Axis.Y, Math.PI / 2, Space.LOCAL);

            landingPad.getTransform().translate(Vector3.Up(), -this.radius + deltaRadius / 2 + 10, Space.LOCAL);

            this.landingPads.push(landingPad);
        }
    }

    update(stellarObjects: Transformable[], deltaSeconds: number) {
        this.getTransform().rotate(Axis.Y, deltaSeconds / computeRingRotationPeriod(this.radius, Settings.G_EARTH * 0.1));
        this.ringMaterial.update(stellarObjects);
        this.metalSectionMaterial.update(stellarObjects);
        this.landingPads.forEach((landingPad) => landingPad.update(stellarObjects));
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        this.root.dispose();
        this.ring.dispose();
        this.ringAggregate.dispose();
        this.ringMaterial.dispose();
        this.metalSectionMaterial.dispose();
        this.arms.forEach((arm) => arm.dispose());
        this.armAggregates.forEach((armAggregate) => armAggregate.dispose());
        this.landingPads.forEach((landingPad) => landingPad.dispose());
    }
}
