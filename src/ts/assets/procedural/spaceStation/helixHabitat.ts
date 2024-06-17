import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Axis } from "@babylonjs/core";
import { Space } from "@babylonjs/core/Maths/math.axis";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Transformable } from "../../../architecture/transformable";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { computeRingRotationPeriod } from "../../../utils/ringRotation";
import { Settings } from "../../../settings";
import { MetalSectionMaterial } from "./metalSectionMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { createTube } from "../../../utils/tubeBuilder";
import { HelixHabitatMaterial } from "./helixHabitatMaterial";

export class HelixHabitat implements Transformable {
    private readonly root: TransformNode;

    private readonly radius: number;

    private readonly attachment: Mesh;

    private readonly helix1: Mesh;
    private readonly helix2: Mesh;

    private readonly helixMaterial: HelixHabitatMaterial;
    private readonly metalSectionMaterial: MetalSectionMaterial;

    private readonly arms: Mesh[] = [];

    constructor(scene: Scene) {
        this.root = new TransformNode("HelixHabitatRoot", scene);

        const nbSpires = 2 + Math.floor(Math.random() * 2);


        this.radius = 5e3 + Math.random() * 10e3;

        const pitch = 2 * this.radius * (1 + 0.3 * (Math.random() * 2 - 1));

        const deltaRadius = 400 + Math.random() * 100;

        const totalLength = pitch * nbSpires;

        const attachmentNbSides = 6 + 2 * Math.floor(Math.random() * 2);

        const tesselation = attachmentNbSides * 8;

        this.metalSectionMaterial = new MetalSectionMaterial(scene);

        this.attachment = MeshBuilder.CreateCylinder(
            "HelixHabitatAttachment",
            {
                diameterTop: 100,
                diameterBottom: 100,
                height: totalLength + deltaRadius * 4,
                tessellation: attachmentNbSides
            },
            scene
        );
        this.attachment.convertToFlatShadedMesh();
        this.attachment.material = this.metalSectionMaterial;
        this.attachment.rotate(Axis.Y, Math.PI / attachmentNbSides, Space.WORLD);
        this.attachment.parent = this.getTransform();

        const path = [];
        const tessellation = 360;
        const turns = nbSpires * tessellation;
        for (let i = 0; i < turns; i++) {
            const angle = Math.PI / 2 + (i * Math.PI * 2.0) / tessellation;
            const y = (i * pitch) / tessellation;
            path.push(new Vector3(this.radius * Math.sin(angle), y - (nbSpires * pitch) / 2, this.radius * Math.cos(angle)));
        }

        this.helix1 = createTube(
            "HelixHabitat",
            {
                path: path,
                radius: Math.sqrt(2) * deltaRadius / 2,
                tessellation: 4,
                cap: Mesh.CAP_ALL
            },
            scene
        );
        this.helix1.convertToFlatShadedMesh();

        this.helix2 = createTube(
            "HelixHabitat",
            {
                path: path,
                radius: Math.sqrt(2) * deltaRadius / 2,
                tessellation: 4,
                cap: Mesh.CAP_ALL
            },
            scene
        );
        this.helix2.convertToFlatShadedMesh();
        this.helix2.rotate(Axis.Y, Math.PI, Space.WORLD);

        this.helix1.parent = this.getTransform();
        this.helix2.parent = this.getTransform();

        const circumference = 2 * Math.PI * this.radius;

        this.helixMaterial = new HelixHabitatMaterial(circumference, deltaRadius, scene);

        this.helix1.material = this.helixMaterial;
        this.helix2.material = this.helixMaterial;

        const nbArms = (attachmentNbSides * nbSpires) / 2;
        for (let i = 0; i <= nbArms; i++) {
            const arm = MeshBuilder.CreateCylinder(
                `HelixHabitatArm${i}`,
                {
                    height: 2 * this.radius,
                    diameter: deltaRadius / 3,
                    tessellation: 6
                },
                scene
            );
            arm.convertToFlatShadedMesh();
            arm.rotate(Axis.Z, Math.PI / 2, Space.LOCAL);
            arm.material = this.metalSectionMaterial;

            const y = (i / nbArms) * totalLength - totalLength / 2;

            const theta = (y / pitch) * Math.PI * 2;

            arm.position.y = y;
            arm.rotate(Axis.Y, theta, Space.WORLD);

            arm.parent = this.getTransform();

            this.arms.push(arm);
        }
    }

    update(stellarObjects: Transformable[], deltaSeconds: number) {
        this.getTransform().rotate(Axis.Y, deltaSeconds / computeRingRotationPeriod(this.radius, Settings.G_EARTH));
        this.helixMaterial.update(stellarObjects);
        this.metalSectionMaterial.update(stellarObjects);
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        this.root.dispose();
        this.attachment.dispose();
        this.helixMaterial.dispose();
        this.metalSectionMaterial.dispose();
        this.helix1.dispose();
        this.helix2.dispose();
        this.arms.forEach((arm) => arm.dispose());
    }
}
