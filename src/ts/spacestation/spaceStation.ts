//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Scene } from "@babylonjs/core/scene";
import { isSizeOnScreenEnough } from "../utils/isObjectVisibleOnScreen";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { SpaceStationModel } from "./spacestationModel";
import { PostProcessType } from "../postProcesses/postProcessTypes";
import { OrbitalObject } from "../architecture/orbitalObject";
import { Cullable } from "../utils/cullable";
import { TransformNode } from "@babylonjs/core/Meshes";
import { OrbitProperties } from "../orbit/orbitProperties";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { OrbitalObjectPhysicalProperties } from "../architecture/physicalProperties";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { LandingPad } from "../landingPad/landingPad";
import { CollisionMask } from "../settings";
import { CelestialBody } from "../architecture/celestialBody";
import { PhysicsMotionType, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { generateSpaceStationName } from "../utils/spaceStationNameGenerator";
import i18n from "../i18n";
import { SpaceStationNodeType } from "../assets/procedural/spaceStation/spaceStationNode";
import { sigmoid } from "../utils/math";
import { UtilitySection } from "../assets/procedural/spaceStation/utilitySection";
import { HelixHabitat } from "../assets/procedural/spaceStation/helixHabitat";
import { RingHabitat } from "../assets/procedural/spaceStation/ringHabitat";
import { Transformable } from "../architecture/transformable";
import { getSolarPanelSurfaceFromEnergyRequirement } from "../utils/solarPanels";
import { StellarObject, StellarObjectModel } from "../architecture/stellarObject";
import { SolarSection } from "../assets/procedural/spaceStation/solarSection";

export class SpaceStation implements OrbitalObject, Cullable {
    readonly name: string;

    readonly model: SpaceStationModel;

    readonly rootAggregate: PhysicsAggregate;

    readonly postProcesses: PostProcessType[] = [];

    readonly childAggregates: PhysicsAggregate[] = [];
    readonly childLocalPositions: Vector3[] = [];

    readonly landingPads: LandingPad[] = [];

    readonly parent: OrbitalObject | null = null;

    solarSections: SolarSection[] = [];
    utilitySections: UtilitySection[] = [];
    helixHabitats: HelixHabitat[] = [];
    ringHabitats: RingHabitat[] = [];

    private readonly root: TransformNode;

    private readonly scene: Scene;

    constructor(scene: Scene, model: SpaceStationModel | number, parentBody: CelestialBody | null = null) {
        this.model = model instanceof SpaceStationModel ? model : new SpaceStationModel(model, parentBody?.model);

        this.name = generateSpaceStationName(this.model.rng, 2756);

        this.parent = parentBody;

        this.root = new TransformNode(this.name, scene);
        this.scene = scene;

        this.generate();

        this.rootAggregate = new PhysicsAggregate(
            this.getTransform(),
            PhysicsShapeType.CONTAINER,
            {
                mass: 0,
                restitution: 0.2
            },
            scene
        );

        this.rootAggregate.body.setMotionType(PhysicsMotionType.STATIC);
        this.rootAggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
        this.rootAggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;

        this.rootAggregate.body.setCollisionCallbackEnabled(true);
        this.rootAggregate.body.getCollisionObservable().add(() => {
            console.log("collision!");
        });

        this.rootAggregate.body.setMassProperties({ inertia: Vector3.Zero(), mass: 0 });

        /*const inverseWorldMatrix = this.getTransform().getWorldMatrix().clone().invert();
        for (const mesh of this.getTransform().getChildMeshes()) {
            const childAggregate = new PhysicsAggregate(mesh, PhysicsShapeType.MESH, {
                mass: 0,
                restitution: 0.2
            }, scene);
            childAggregate.body.disablePreStep = false;
            this.childAggregates.push(childAggregate);

            const worldPosition = mesh.getAbsolutePosition();
            const localPosition = Vector3.TransformCoordinates(worldPosition, inverseWorldMatrix);

            this.childLocalPositions.push(localPosition);
        }*/

        this.rootAggregate.body.disablePreStep = false;
    }

    handleDockingRequest(): LandingPad | null {
        const availableLandingPads = this.landingPads;
        const nbPads = availableLandingPads.length;

        if (nbPads === 0) return null;

        return availableLandingPads[Math.floor(Math.random() * nbPads)];
    }

    getRotationAxis(): Vector3 {
        return this.getTransform().up;
    }

    getOrbitProperties(): OrbitProperties {
        return this.model.orbit;
    }

    getPhysicalProperties(): OrbitalObjectPhysicalProperties {
        return this.model.physicalProperties;
    }

    public getBoundingRadius(): number {
        return 2e3;
    }

    getTypeName(): string {
        return i18n.t("objectTypes:spaceStation");
    }

    public computeCulling(cameras: Camera[]): void {
        let isVisible = false;
        for (const camera of cameras) {
            isVisible = isVisible || isSizeOnScreenEnough(this, camera);
        }
        for (const mesh of this.root.getChildMeshes()) {
            mesh.isVisible = isVisible;
        }
    }

    private generate() {

        // find distance to star
        let distanceToStar: number | null = null;
        let parent = this.parent;
        let stellarObject: StellarObject | null = null;
        while (parent !== null) {
            distanceToStar = parent.getOrbitProperties().radius;
            if (parent.parent === null) {
                stellarObject = parent as StellarObject;
                break;
            }
            parent = parent.parent;
        }

        if (stellarObject === null) {
            throw new Error("No stellar object found");
        }

        if (distanceToStar === null) {
            throw new Error("No distance to star found");
        }

        const starRadius = stellarObject.model.radius;
        const starTemperature = stellarObject.model.temperature;
        const energyRequirement = this.model.population * this.model.energyConsumptionPerCapita;

        const solarPanelSurface = getSolarPanelSurfaceFromEnergyRequirement(0.4, distanceToStar, starTemperature, starRadius, energyRequirement, 0.5);


        let lastNode: TransformNode | null = null;

        const solarSection = new SolarSection(solarPanelSurface, this.scene);
        solarSection.getTransform().parent = this.getTransform();
        lastNode = solarSection.getTransform();
        this.solarSections.push(solarSection);

        let urgeToCreateHabitat = 0;
        for (let i = 0; i < 10; i++) {
            let nodeType = SpaceStationNodeType.UTILITY_SECTION;
            if (Math.random() < sigmoid(urgeToCreateHabitat - 6) && urgeToCreateHabitat > 0) {
                nodeType = Math.random() < 0.5 ? SpaceStationNodeType.RING_HABITAT : SpaceStationNodeType.HELIX_HABITAT;
            }

            let newNode: TransformNode | null = null;

            if (nodeType === SpaceStationNodeType.UTILITY_SECTION) {
                const utilitySection = new UtilitySection(this.scene);
                this.utilitySections.push(utilitySection);
                newNode = utilitySection.getTransform();
            } else if (nodeType === SpaceStationNodeType.HELIX_HABITAT) {
                const helixHabitat = new HelixHabitat(this.scene);
                this.helixHabitats.push(helixHabitat);
                newNode = helixHabitat.getTransform();
                urgeToCreateHabitat = 0;
            } else if (nodeType === SpaceStationNodeType.RING_HABITAT) {
                const ringHabitat = new RingHabitat(this.scene);
                this.ringHabitats.push(ringHabitat);
                newNode = ringHabitat.getTransform();
                urgeToCreateHabitat = 0;
            }

            if (newNode === null) {
                throw new Error("Node creation failed");
            }

            if (lastNode !== null) {
                this.placeNode(newNode, lastNode);
            }

            newNode.parent = this.root;

            lastNode = newNode;
            urgeToCreateHabitat++;
        }
    }

    private placeNode(node: TransformNode, parent: TransformNode) {
        const previousBoundingVectors = parent.getHierarchyBoundingVectors();
        const previousBoundingExtendSize = previousBoundingVectors.max.subtract(previousBoundingVectors.min).scale(0.5);

        const newBoundingVectors = node.getHierarchyBoundingVectors();
        const newBoundingExtendSize = newBoundingVectors.max.subtract(newBoundingVectors.min).scale(0.5);

        const previousSectionSizeY = previousBoundingExtendSize.y;
        const newSectionY = newBoundingExtendSize.y;

        node.position = parent.position.add(parent.up.scale(previousSectionSizeY + newSectionY));
    }

    update(stellarObjects: Transformable[], deltaSeconds: number) {
        this.solarSections.forEach(solarSection => solarSection.update(stellarObjects));
        this.utilitySections.forEach((utilitySection) => utilitySection.update(stellarObjects));
        this.helixHabitats.forEach((helixHabitat) => helixHabitat.update(stellarObjects, deltaSeconds));
        this.ringHabitats.forEach((ringHabitat) => ringHabitat.update(stellarObjects, deltaSeconds));

        /*const worldMatrix = this.getTransform().computeWorldMatrix(true);
        for (let i = 0; i < this.childAggregates.length; i++) {
            const childAggregate = this.childAggregates[i];
            const localPosition = this.childLocalPositions[i];

            // this is necessary because Havok ignores regular parenting
            childAggregate.transformNode.setAbsolutePosition(Vector3.TransformCoordinates(localPosition, worldMatrix));
        }*/
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        this.root.dispose();
        this.utilitySections.forEach((utilitySection) => utilitySection.dispose());
        this.helixHabitats.forEach((helixHabitat) => helixHabitat.dispose());
        this.ringHabitats.forEach((ringHabitat) => ringHabitat.dispose());

        this.rootAggregate.dispose();
        this.childAggregates.forEach((childAggregate) => childAggregate.dispose());
    }
}
