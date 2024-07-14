//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
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
import { CelestialBody } from "../architecture/celestialBody";
import i18n from "../i18n";
import { SpaceStationNodeType } from "../assets/procedural/spaceStation/spaceStationNode";
import { UtilitySection } from "../assets/procedural/spaceStation/utilitySection";
import { HelixHabitat } from "../assets/procedural/spaceStation/helixHabitat";
import { RingHabitat } from "../assets/procedural/spaceStation/ringHabitat";
import { Transformable } from "../architecture/transformable";
import { getSolarPanelSurfaceFromEnergyRequirement } from "../utils/solarPanels";
import { StellarObject } from "../architecture/stellarObject";
import { SolarSection } from "../assets/procedural/spaceStation/solarSection";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { wheelOfFortune } from "../utils/random";
import { CylinderHabitat } from "../assets/procedural/spaceStation/cylinderHabitat";
import { LandingBay } from "../assets/procedural/spaceStation/landingBay";
import { LandingPad } from "../assets/procedural/landingPad/landingPad";
import { LandingRequest, ManagesLandingPads } from "../utils/managesLandingPads";
import { getEdibleEnergyPerHaPerDay } from "../utils/agriculture";
import { Settings } from "../settings";
import { Objects } from "../assets/objects";
import { EngineBay } from "../assets/procedural/spaceStation/engineBay";

export class SpaceStation implements OrbitalObject, Cullable, ManagesLandingPads {
    readonly name: string;

    readonly model: SpaceStationModel;

    readonly postProcesses: PostProcessType[] = [];

    readonly childAggregates: PhysicsAggregate[] = [];

    readonly parent: OrbitalObject | null = null;

    readonly solarSections: SolarSection[] = [];
    readonly utilitySections: UtilitySection[] = [];
    readonly helixHabitats: HelixHabitat[] = [];
    readonly ringHabitats: RingHabitat[] = [];
    readonly cylinderHabitats: CylinderHabitat[] = [];
    readonly landingBays: LandingBay[] = [];
    readonly engineBays: EngineBay[] = [];

    private readonly root: TransformNode;

    private readonly scene: Scene;

    private readonly boundingRadius: number;

    constructor(scene: Scene, model: SpaceStationModel | number, parentBody: CelestialBody | null = null) {
        this.model = model instanceof SpaceStationModel ? model : new SpaceStationModel(model, parentBody?.model);

        this.name = this.model.name;

        this.parent = parentBody;

        this.root = new TransformNode(this.name, scene);
        this.scene = scene;

        this.generate();

        // center the space station on its center of mass
        const boundingVectors = this.getTransform().getHierarchyBoundingVectors();
        const centerWorld = boundingVectors.max.add(boundingVectors.min).scale(0.5);
        const deltaPosition = this.getTransform().getAbsolutePosition().subtract(centerWorld);

        this.getTransform()
            .getChildTransformNodes(true)
            .forEach((transform) => transform.position.addInPlace(deltaPosition));

        this.root.rotate(Axis.X, this.model.physicalProperties.axialTilt);
        this.root.rotate(Axis.Z, this.model.physicalProperties.axialTilt);

        const extendSize = boundingVectors.max.subtract(boundingVectors.min).scale(0.5);
        this.boundingRadius = Math.max(extendSize.x, extendSize.y, extendSize.z);
    }

    handleLandingRequest(request: LandingRequest): LandingPad | null {
        const availableLandingPads = this.landingBays
            .flatMap((landingBay) => {
                return landingBay.landingPads;
            })
            .filter((landingPad) => {
                return landingPad.padSize >= request.minimumPadSize;
            })
            .sort((a, b) => {
                return a.padSize - b.padSize;
            });

        if (availableLandingPads.length === 0) return null;

        return availableLandingPads[0];
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
        return this.boundingRadius;
    }

    getTypeName(): string {
        return i18n.t("objectTypes:spaceStation");
    }

    public computeCulling(cameras: Camera[]): void {
        let isVisible = false;
        for (const camera of cameras) {
            isVisible = isVisible || isSizeOnScreenEnough(this, camera);
        }

        this.getTransform().setEnabled(isVisible);
    }

    private generate() {
        // find distance to star
        let distanceToStar = this.model.orbit.radius;
        let parent = this.parent;
        let stellarObject: StellarObject | null = null;
        while (parent !== null) {
            if (parent.parent === null) {
                stellarObject = parent as StellarObject;
                break;
            }
            distanceToStar += parent.getOrbitProperties().radius;
            parent = parent.parent;
        }

        if (stellarObject === null) {
            throw new Error("No stellar object found");
        }

        const starRadius = stellarObject.model.radius;
        const starTemperature = stellarObject.model.temperature;
        const energyRequirement = this.model.population * this.model.energyConsumptionPerCapita;

        const solarPanelSurface = getSolarPanelSurfaceFromEnergyRequirement(0.4, distanceToStar, starTemperature, starRadius, energyRequirement, 0.5);

        let habitatSurfaceHa = (100 * this.model.population) / this.model.populationDensity;
        this.model.agricultureMix.forEach(([fraction, cropType]) => {
            habitatSurfaceHa +=
                (fraction * this.model.population * Settings.INDIVIDUAL_AVERAGE_DAILY_INTAKE) /
                (Settings.HYDROPONIC_TO_CONVENTIONAL_RATIO * this.model.nbHydroponicLayers * getEdibleEnergyPerHaPerDay(cropType));
        });
        const habitatSurface = habitatSurfaceHa * 1000;

        let lastNode: TransformNode | null = null;

        const engineBay = new EngineBay(this.scene);
        engineBay.getTransform().parent = this.getTransform();
        lastNode = engineBay.getTransform();
        this.engineBays.push(engineBay);

        lastNode = this.addUtilitySections(lastNode, 5 + Math.floor(this.model.rng(564) * 5));

        const solarSection = new SolarSection(solarPanelSurface, Settings.SEED_HALF_RANGE * this.model.rng(31), this.scene);
        solarSection.getTransform().parent = this.getTransform();
        this.placeNode(solarSection.getTransform(), lastNode);
        lastNode = solarSection.getTransform();
        this.solarSections.push(solarSection);

        lastNode = this.addUtilitySections(lastNode, 5 + Math.floor(this.model.rng(23) * 5));

        const habitatType = wheelOfFortune(
            [
                [SpaceStationNodeType.RING_HABITAT, 0.5],
                [SpaceStationNodeType.HELIX_HABITAT, 0.3],
                [SpaceStationNodeType.CYLINDER_HABITAT, 0.2]
            ],
            this.model.rng(17)
        );

        let newNode: TransformNode | null = null;
        if (habitatType === SpaceStationNodeType.HELIX_HABITAT) {
            const helixHabitat = new HelixHabitat(habitatSurface, Settings.SEED_HALF_RANGE * this.model.rng(19), this.scene);
            this.helixHabitats.push(helixHabitat);
            newNode = helixHabitat.getTransform();
        } else if (habitatType === SpaceStationNodeType.RING_HABITAT) {
            const ringHabitat = new RingHabitat(this.model, habitatSurface, Settings.SEED_HALF_RANGE * this.model.rng(27), this.scene);
            this.ringHabitats.push(ringHabitat);
            newNode = ringHabitat.getTransform();
        } else if (habitatType === SpaceStationNodeType.CYLINDER_HABITAT) {
            const cylinderHabitat = new CylinderHabitat(habitatSurface, Settings.SEED_HALF_RANGE * this.model.rng(13), this.scene);
            this.cylinderHabitats.push(cylinderHabitat);
            newNode = cylinderHabitat.getTransform();
        }

        if (newNode === null) {
            throw new Error("Node creation failed");
        }

        if (lastNode !== null) {
            this.placeNode(newNode, lastNode);
        }

        newNode.parent = this.root;

        lastNode = newNode;

        lastNode = this.addUtilitySections(lastNode, 5 + Math.floor(this.model.rng(23) * 5));

        const landingBay = new LandingBay(this.model, this.model.rng(37) * Settings.SEED_HALF_RANGE, this.scene);

        this.landingBays.push(landingBay);
        this.placeNode(landingBay.getTransform(), lastNode);
        landingBay.getTransform().parent = this.root;
    }

    private addUtilitySections(lastNode: TransformNode, nbSections: number): TransformNode {
        let newLastNode = lastNode;
        for (let i = 0; i < nbSections; i++) {
            const utilitySection = new UtilitySection(this.model.rng(132 + 10 * this.utilitySections.length) * Settings.SEED_HALF_RANGE, this.scene);
            this.utilitySections.push(utilitySection);

            this.placeNode(utilitySection.getTransform(), newLastNode);

            utilitySection.getTransform().parent = this.root;

            newLastNode = utilitySection.getTransform();
        }

        return newLastNode;
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

    update(stellarObjects: Transformable[], cameraWorldPosition: Vector3, deltaSeconds: number) {
        this.solarSections.forEach((solarSection) => solarSection.update(stellarObjects, cameraWorldPosition));
        this.utilitySections.forEach((utilitySection) => utilitySection.update(stellarObjects, cameraWorldPosition));
        this.helixHabitats.forEach((helixHabitat) => helixHabitat.update(stellarObjects, cameraWorldPosition, deltaSeconds));
        this.ringHabitats.forEach((ringHabitat) => ringHabitat.update(stellarObjects, cameraWorldPosition, deltaSeconds));
        this.cylinderHabitats.forEach((cylinderHabitat) => cylinderHabitat.update(stellarObjects, cameraWorldPosition, deltaSeconds));
        this.landingBays.forEach((landingBay) => landingBay.update(stellarObjects, cameraWorldPosition, deltaSeconds));
        this.engineBays.forEach((engineBay) => engineBay.update(stellarObjects, cameraWorldPosition));
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        this.root.dispose();
        this.utilitySections.forEach((utilitySection) => utilitySection.dispose());
        this.helixHabitats.forEach((helixHabitat) => helixHabitat.dispose());
        this.ringHabitats.forEach((ringHabitat) => ringHabitat.dispose());
        this.cylinderHabitats.forEach((cylinderHabitat) => cylinderHabitat.dispose());
        this.landingBays.forEach((landingBay) => landingBay.dispose());
        this.engineBays.forEach((engineBay) => engineBay.dispose());

        this.childAggregates.forEach((childAggregate) => childAggregate.dispose());
    }
}
