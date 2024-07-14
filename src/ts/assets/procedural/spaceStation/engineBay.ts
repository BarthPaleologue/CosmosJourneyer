import { Transformable } from "../../../architecture/transformable";
import { Mesh, MeshBuilder } from "@babylonjs/core/Meshes";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { PhysicsShape, PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";
import { Objects } from "../../objects";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { MetalSectionMaterial } from "./metalSectionMaterial";
import { Scene } from "@babylonjs/core/scene";
import { Axis, Space } from "@babylonjs/core/Maths/math.axis";

export class EngineBay implements Transformable {
    private readonly root: TransformNode;

    private readonly skirt: Mesh;
    private readonly skirtMaterial: MetalSectionMaterial;

    private readonly engines: AbstractMesh[] = [];
    private readonly engineBodies: PhysicsBody[] = [];
    private readonly engineShape: PhysicsShape;

    constructor(scene: Scene) {
        this.root = new TransformNode("EngineBayRoot", scene);

        const nbEngines = 6;
        this.skirt = MeshBuilder.CreateCylinder("EngineBaySkirt", {
            diameterTop: 100,
            height: 400,
            diameterBottom: 250,
            tessellation: nbEngines
        });
        this.skirt.convertToFlatShadedMesh();

        this.skirtMaterial = new MetalSectionMaterial(scene);

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

        this.engines.forEach(engine => {
            engine.parent = this.root;
            engine.translate(Axis.Y, -300, Space.LOCAL);
            engine.scaling.scaleInPlace(100);
        });

        const boundingVectors = this.getTransform().getHierarchyBoundingVectors();
        const center = boundingVectors.max.add(boundingVectors.min).scale(0.5);

        this.root.getChildTransformNodes(true).forEach((node) => {
            node.position.subtractInPlace(center);
        });

        this.engineShape = new PhysicsShapeMesh(this.engines[0] as Mesh, scene);
    }

    update(stellarObjects: Transformable[]) {
        this.skirtMaterial.update(stellarObjects);
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        this.skirt.dispose();
        this.skirtMaterial.dispose();
        this.engines.forEach((engine) => engine.dispose());
        this.engineShape.dispose();
    }
}