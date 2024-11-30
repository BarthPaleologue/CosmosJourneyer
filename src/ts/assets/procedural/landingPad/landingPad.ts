import { Transformable } from "../../../architecture/transformable";
import { Mesh } from "@babylonjs/core/Meshes";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { LandingPadMaterial } from "./landingPadMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { CollisionMask, Settings } from "../../../settings";
import i18n from "../../../i18n";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { Objects } from "../../objects";
import { ObjectTargetCursorType, Targetable, TargetInfo } from "../../../architecture/targetable";

export const enum LandingPadSize {
    SMALL = 1,
    MEDIUM = 2,
    LARGE = 3
}

export class LandingPad implements Targetable {
    private readonly deck: Mesh;
    private readonly deckAggregate: PhysicsAggregate;

    private readonly deckMaterial: LandingPadMaterial;

    private readonly crates: InstancedMesh[] = [];

    readonly padNumber: number;
    readonly padSize: LandingPadSize;

    private readonly boundingRadius: number;

    readonly targetInfo: TargetInfo;

    readonly padHeight = 0.5;

    constructor(padNumber: number, padSize: LandingPadSize, scene: Scene) {
        this.padSize = padSize;

        const width = 40 * padSize;
        const depth = width * Settings.LANDING_PAD_ASPECT_RATIO;

        this.boundingRadius = depth / 2;

        this.padNumber = padNumber;

        this.deckMaterial = new LandingPadMaterial(padNumber, scene);

        this.deck = MeshBuilder.CreateBox(
            `Landing Pad ${padNumber}`,
            {
                width: width,
                depth: depth,
                height: this.padHeight
            },
            scene
        );
        this.deck.material = this.deckMaterial;

        this.deckAggregate = new PhysicsAggregate(this.deck, PhysicsShapeType.BOX, { mass: 0, friction: 10 }, scene);
        this.deckAggregate.body.disablePreStep = false;
        this.deckAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
        this.deckAggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;

        const nbBoxes = Math.floor(Math.random() * 5);
        for (let i = 0; i < nbBoxes; i++) {
            const corner1 = Math.random() < 0.5 ? -1 : 1;
            const corner2 = Math.random() < 0.5 ? -1 : 1;

            const crateSize = Math.random() < 0.2 ? 0.5 : 1;
            const crate = Objects.CRATE.createInstance(`crate${i}`);
            crate.scaling.scaleInPlace(crateSize);
            crate.parent = this.deck;
            crate.position.y += 0.25 + crateSize / 2;

            let nbTries = 0;
            const maxTries = 10;
            do {
                crate.position.x = (corner1 * (width - 10 * Math.random() - 3)) / 2;
                crate.position.z = (corner2 * (depth - 10 * Math.random() - 3)) / 2;
                crate.rotation.y = Math.random() * Math.PI * 2;
                nbTries++;
                if (nbTries > maxTries) {
                    crate.dispose();
                    break;
                }
            } while (!this.crates.every((otherCrate) => Vector3.Distance(crate.position, otherCrate.position) > 1.5));

            if (nbTries <= maxTries) {
                this.crates.push(crate);
            }
        }

        this.targetInfo = {
            type: ObjectTargetCursorType.LANDING_PAD,
            minDistance: this.getBoundingRadius() * 4.0,
            maxDistance: this.getBoundingRadius() * 6.0
        };
    }

    update(stellarObjects: Transformable[], cameraWorldPosition: Vector3): void {
        this.deckMaterial.update(stellarObjects);

        const padCameraDistance2 = Vector3.DistanceSquared(cameraWorldPosition, this.deck.getAbsolutePosition());
        const distanceThreshold = 12e3;
        const isEnabled = padCameraDistance2 < distanceThreshold * distanceThreshold;
        this.getTransform().setEnabled(isEnabled);
    }

    getTransform(): TransformNode {
        return this.deck;
    }

    getBoundingRadius(): number {
        return this.boundingRadius;
    }

    dispose() {
        this.deck.dispose();
        this.deckAggregate.dispose();
        this.deckMaterial.dispose();
        this.crates.forEach((crate) => crate.dispose());
    }

    getTypeName(): string {
        return i18n.t("objectTypes:landingPad");
    }
}
