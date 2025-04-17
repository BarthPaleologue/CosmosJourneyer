import { Transformable } from "../../../architecture/transformable";
import { Mesh, MeshBuilder } from "@babylonjs/core/Meshes";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { PhysicsShape, PhysicsShapeConvexHull } from "@babylonjs/core/Physics/v2/physicsShape";
import { Objects } from "../../objects";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { MetalSectionMaterial } from "./metalSectionMaterial";
import { Scene } from "@babylonjs/core/scene";
import { Axis, Space } from "@babylonjs/core/Maths/math.axis";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CollisionMask } from "../../../settings";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsMotionType, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { createEnvironmentAggregate } from "../../../utils/havok";
import { Material } from "@babylonjs/core/Materials/material";
import { Assets2 } from "../../assets";

export class EngineBay implements Transformable {
    private readonly root: TransformNode;

    private readonly skirt: Mesh;
    private skirtAggregate: PhysicsAggregate | null = null;
    private readonly skirtMaterial: Material;

    private readonly engines: AbstractMesh[] = [];
    private readonly engineBodies: PhysicsBody[] = [];
    private readonly engineShape: PhysicsShape;

    private readonly scene: Scene;

    constructor(assets: Pick<Assets2, "textures">, scene: Scene) {
        this.root = new TransformNode("EngineBayRoot", scene);

        this.scene = scene;

        const nbEngines = 6;
        this.skirt = MeshBuilder.CreateCylinder(
            "EngineBaySkirt",
            {
                diameterTop: 100,
                height: 400,
                diameterBottom: 250,
                tessellation: nbEngines
            },
            scene
        );
        this.skirt.convertToFlatShadedMesh();

        this.skirtMaterial = new MetalSectionMaterial(
            "EngineBayMetalSectionMaterial",
            assets.textures.materials.metalPanels,
            scene
        );

        this.skirt.material = this.skirtMaterial;
        this.skirt.parent = this.root;

        const centerEngine = Objects.STATION_ENGINE.createInstance("Engine");
        this.engines.push(centerEngine);

        for (let i = 0; i < nbEngines; i++) {
            const engine = Objects.STATION_ENGINE.createInstance("Engine");
            engine.rotate(Axis.Y, ((Math.PI * 2) / nbEngines) * i, Space.LOCAL);
            engine.translate(Axis.X, 80, Space.LOCAL);
            this.engines.push(engine);
        }

        this.engines.forEach((engine) => {
            engine.parent = this.root;
            engine.translate(Axis.Y, -300, Space.LOCAL);
            engine.scaling.scaleInPlace(100);
        });

        const boundingVectors = this.getTransform().getHierarchyBoundingVectors();
        const center = boundingVectors.max.add(boundingVectors.min).scale(0.5);

        this.root.getChildTransformNodes(true).forEach((node) => {
            node.position.subtractInPlace(center);
        });

        this.engineShape = new PhysicsShapeConvexHull(this.engines[0] as Mesh, scene);
        this.engineShape.filterMembershipMask = CollisionMask.ENVIRONMENT;
        this.engineShape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;
    }

    update(cameraWorldPosition: Vector3) {
        const distanceToCamera = Vector3.Distance(cameraWorldPosition, this.getTransform().getAbsolutePosition());
        if (distanceToCamera < 350e3 && this.skirtAggregate === null) {
            this.skirtAggregate = createEnvironmentAggregate(this.skirt, PhysicsShapeType.MESH, this.scene);
            this.engines.forEach((engine) => {
                const engineBody = new PhysicsBody(engine, PhysicsMotionType.STATIC, false, this.scene);
                engineBody.setMassProperties({ mass: 0 });
                engineBody.shape = this.engineShape;
                engineBody.disablePreStep = false;
                this.engineBodies.push(engineBody);
            });
        } else if (distanceToCamera > 360e3 && this.skirtAggregate !== null) {
            this.skirtAggregate.dispose();
            this.skirtAggregate = null;

            this.engineBodies.forEach((body) => body.dispose());
            this.engineBodies.length = 0;
        }
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        this.skirt.dispose();
        this.skirtMaterial.dispose();
        this.skirtAggregate?.dispose();
        this.engines.forEach((engine) => engine.dispose());
        this.engineBodies.forEach((body) => body.dispose());
        this.engineShape.dispose();
    }
}
