import { Scene } from "@babylonjs/core/scene";
import { CreateBox, CreateTube, TransformNode } from "@babylonjs/core/Meshes";
import { Transformable } from "../architecture/transformable";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Axis, Space } from "@babylonjs/core/Maths/math.axis";
import { SolarPanelMaterial } from "../assets/procedural/solarPanel/solarPanelMaterial";
import { MetalSectionMaterial } from "../assets/procedural/spaceStation/metalSectionMaterial";
import { ClimberRingMaterial } from "../materials/climberRingMaterial";
import i18n from "../i18n";
import { ObjectTargetCursorType, Targetable, TargetInfo } from "../architecture/targetable";

export class SpaceElevatorClimber implements Targetable {
    private readonly transform: TransformNode;

    private readonly solarPanelMaterial: SolarPanelMaterial;
    private readonly metalSectionMaterial: MetalSectionMaterial;

    private readonly boundingRadius: number;

    readonly targetInfo: TargetInfo;

    constructor(scene: Scene) {
        this.transform = new TransformNode("SpaceElevatorClimber", scene);

        this.solarPanelMaterial = new SolarPanelMaterial(scene);
        this.metalSectionMaterial = new MetalSectionMaterial(scene);

        const angleSubtracted = Math.PI / 6;
        const minAngle = -Math.PI / 2 + angleSubtracted / 2;
        const maxAngle = Math.PI / 2 - angleSubtracted / 2;
        const nbPoints = 64;

        const globalRadius = 100;
        const innerRadius = 10;

        const yThickness = 0.5;

        const rightPath = [];
        for (let theta = minAngle; theta <= maxAngle; theta += (maxAngle - minAngle) / nbPoints) {
            const x = Math.cos(theta) * globalRadius;
            const z = Math.sin(theta) * globalRadius;
            rightPath.push(new Vector3(x, 0, z));
        }

        const rightRing = CreateTube(
            "ClimberRightRing",
            {
                path: rightPath,
                cap: Mesh.CAP_ALL,
                radius: innerRadius
            },
            scene
        );
        rightRing.scaling.y = yThickness;
        rightRing.parent = this.transform;

        rightRing.material = new ClimberRingMaterial("ClimberRingMaterial", scene);

        const leftRing = rightRing.clone("ClimberLeftRing");
        leftRing.rotate(Axis.Y, Math.PI);

        const arm1 = CreateBox(
            "ClimberArm1",
            {
                height: globalRadius * 2,
                width: (innerRadius * yThickness) / 4,
                depth: (innerRadius * yThickness) / 4
            },
            scene
        );
        arm1.material = this.metalSectionMaterial;
        arm1.rotate(Axis.Z, Math.PI / 2, Space.WORLD);
        arm1.parent = this.transform;

        const armAngles = [Math.PI / 4, -Math.PI / 4];

        armAngles.forEach((angle, index) => {
            const arm = arm1.clone(`ClimberArm${index + 2}`);
            arm.rotate(Axis.Y, angle, Space.WORLD);
            arm.parent = this.transform;
        });

        const solarPanelWidth = 100;
        const solarPanelDepth = 20;
        const solarPanelThickness = 0.1;

        const solarPanelAngleSpacing = Math.PI / 6;

        const solarPanel1 = CreateBox(
            "ClimberSolarPanel1",
            {
                width: solarPanelWidth,
                height: solarPanelThickness,
                depth: solarPanelDepth
            },
            scene
        );
        solarPanel1.material = this.solarPanelMaterial;
        solarPanel1.position.x = globalRadius + solarPanelWidth / 2;
        solarPanel1.parent = this.transform;

        const angles = [
            solarPanelAngleSpacing,
            -solarPanelAngleSpacing,
            Math.PI + solarPanelAngleSpacing,
            Math.PI - solarPanelAngleSpacing,
            Math.PI
        ];

        angles.forEach((angle, index) => {
            const solarPanel2 = solarPanel1.clone(`ClimberSolarPanel${index + 2}`);
            solarPanel2.parent = this.transform;
            solarPanel2.rotateAround(Vector3.Zero(), Axis.Y, angle);
        });

        this.boundingRadius = globalRadius + solarPanelWidth;

        this.targetInfo = {
            type: ObjectTargetCursorType.FACILITY,
            minDistance: this.getBoundingRadius() * 7.0,
            maxDistance: this.getBoundingRadius() * 3000
        };
    }

    getBoundingRadius(): number {
        return this.boundingRadius;
    }

    getTypeName(): string {
        return i18n.t("objectTypes:spaceElevatorClimber");
    }

    update(stellarObjects: Transformable[]) {
        this.solarPanelMaterial.update(stellarObjects);
        this.metalSectionMaterial.update(stellarObjects);
    }

    getTransform() {
        return this.transform;
    }

    dispose() {
        this.solarPanelMaterial.dispose();
        this.metalSectionMaterial.dispose();
        this.transform.dispose();
    }
}
