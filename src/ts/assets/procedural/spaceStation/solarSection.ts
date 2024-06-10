import { wheelOfFortune } from "../../../utils/wheelOfFortune";
import { Transformable } from "../../../architecture/transformable";
import { Mesh } from "@babylonjs/core/Meshes";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Axis, Scene } from "@babylonjs/core";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Space } from "@babylonjs/core/Maths/math.axis";
import { SolarPanelMaterial } from "../solarPanel/solarPanelMaterial";

export class SolarSection implements Transformable {
    private readonly attachment: Mesh;

    private readonly arms: Mesh[] = [];

    private readonly solarPanelMaterial: SolarPanelMaterial;

    constructor(requiredSurface: number, scene: Scene) {
        const nbArms = wheelOfFortune(
            [
                [1, 0.2],
                [2, 0.3],
                [3, 0.2],
                [4, 0.2],
                [5, 0.1]
            ],
            Math.random()
        );

        let attachmentLength = 200;

        if (nbArms === 1) {
            // in this case we will need a larger body to fit all the panels on the main attachment
            const sideSurface = requiredSurface / 2;
            const squareSideSize = Math.sqrt(sideSurface);

            attachmentLength = squareSideSize * 1.618;
        }

        this.attachment = MeshBuilder.CreateCylinder(
            "SolarSectionAttachment",
            {
                diameterTop: 100,
                diameterBottom: 100,
                height: attachmentLength,
                tessellation: nbArms < 3 ? 6 : nbArms * 2
            },
            scene
        );
        this.attachment.convertToFlatShadedMesh();

        this.solarPanelMaterial = new SolarPanelMaterial(scene);

        console.log("Nb arms", nbArms);

        if (nbArms === 1) {
            const halfRequiredSurface = requiredSurface / 2;
            const armSize = attachmentLength;
            const nbPanelsPerSide = Math.ceil(armSize / 1000);

            const gap = 200;

            const panelDimensionY = (armSize / nbPanelsPerSide) - gap;
            const panelDimensionX = halfRequiredSurface / armSize;

            for(let i = 0; i < nbPanelsPerSide; i++) {
                const panel1 = MeshBuilder.CreateBox("SolarPanel1", {
                    height: 0.3,
                    width: panelDimensionY,
                    depth: panelDimensionX 
                });
                panel1.parent = this.getTransform();
                panel1.material = this.solarPanelMaterial;
                panel1.translate(Axis.Y, (panelDimensionY + gap) * (i - (nbPanelsPerSide-1) / 2));
                panel1.translate(Axis.Z, panelDimensionX / 2);
                panel1.rotate(Axis.Z, Math.PI / 2);

                const panel2 = MeshBuilder.CreateBox("SolarPanel2", {
                    height: 0.3,
                    width: panelDimensionY,
                    depth: panelDimensionX 
                });
                panel2.parent = this.getTransform();
                panel2.material = this.solarPanelMaterial;
                panel2.translate(Axis.Y, (panelDimensionY + gap) * (i - (nbPanelsPerSide-1) / 2));
                panel2.translate(Axis.Z, -panelDimensionX / 2);
                panel2.rotate(Axis.Z, Math.PI / 2);
            }
        } else if (nbArms === 2) {

        } else if (nbArms >= 3) {
            this.generateStarPattern(nbArms, requiredSurface);
        }
    }

    private generateStarPattern(nbArms: number, requiredSurface: number) {
        const scene = this.getTransform().getScene();

        // there will be two solar array per arm, so the surface is distributed over 2*nbArms
        const surfacePerArm = requiredSurface / (2 * nbArms);
        const squareSideSize = Math.sqrt(surfacePerArm);
        const armLength = squareSideSize * 2.618;
        for (let i = 0; i <= nbArms; i++) {
            const armThickness = 100;
            const arm = MeshBuilder.CreateBox(
                `RingHabitatArm${i}`,
                {
                    width: armLength,
                    depth: armThickness,
                    height: armThickness
                },
                scene
            );

            const theta = (i / nbArms) * Math.PI * 2;
            arm.rotate(Axis.Y, theta, Space.WORLD);
            arm.translate(Axis.X, armLength / 2, Space.LOCAL);
            arm.parent = this.getTransform();
            this.arms.push(arm);

            const armOffset = nbArms * 0.3 * surfacePerArm / armLength;

            const solarPanel1 = MeshBuilder.CreateBox("SolarPanel1", {
                height: 0.3,
                width: armLength,
                depth: surfacePerArm / armLength
            }, scene);
            solarPanel1.parent = arm;
            solarPanel1.translate(Axis.X, armOffset);
            solarPanel1.translate(Axis.Z, 0.5 * (surfacePerArm / armLength + armThickness));
            solarPanel1.material = this.solarPanelMaterial;

            const solarPanel2 = MeshBuilder.CreateBox("SolarPanel2", {
                height: 0.3,
                width: armLength,
                depth: surfacePerArm / armLength
            }, scene);
            solarPanel2.parent = arm;
            solarPanel2.translate(Axis.X, armOffset);
            solarPanel2.translate(Axis.Z, -0.5 * (surfacePerArm / armLength + armThickness));
            solarPanel2.material = this.solarPanelMaterial;
        }
    }

    update(stellarObjects: Transformable[]) {
        if (this.solarPanelMaterial !== null) {
            this.solarPanelMaterial.update(stellarObjects);
        }
    }

    public getTransform(): TransformNode {
        return this.attachment;
    }

    public dispose() {
        this.getTransform().dispose();
        this.arms.forEach(arm => arm.dispose());
        this.solarPanelMaterial.dispose();
    }
}