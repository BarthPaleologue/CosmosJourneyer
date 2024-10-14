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
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { OrbitalObjectPhysicalProperties } from "../architecture/physicalProperties";
import { SpaceStationNodeType } from "../assets/procedural/spaceStation/spaceStationNode";
import { UtilitySection } from "../assets/procedural/spaceStation/utilitySection";
import { HelixHabitat } from "../assets/procedural/spaceStation/helixHabitat";
import { RingHabitat } from "../assets/procedural/spaceStation/ringHabitat";
import { Transformable } from "../architecture/transformable";
import { SolarSection } from "../assets/procedural/spaceStation/solarSection";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { wheelOfFortune } from "../utils/random";
import { CylinderHabitat } from "../assets/procedural/spaceStation/cylinderHabitat";
import { LandingBay } from "../assets/procedural/spaceStation/landingBay";
import { LandingPad } from "../assets/procedural/landingPad/landingPad";
import { LandingRequest, ManagesLandingPads } from "../utils/managesLandingPads";
import { Settings } from "../settings";
import { EngineBay } from "../assets/procedural/spaceStation/engineBay";
import { Orbit } from "../orbit/orbit";

import { getRngFromSeed } from "../utils/getRngFromSeed";
import i18n from "../i18n";
import { orbitalObjectTypeToDisplay } from "../utils/orbitalObjectTypeToDisplay";

export class SpaceStation implements OrbitalObject, Cullable, ManagesLandingPads {
    readonly name: string;

    readonly model: SpaceStationModel;

    readonly postProcesses: PostProcessType[] = [];

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

    constructor(model: SpaceStationModel, scene: Scene) {
        this.model = model;

        this.name = this.model.name;

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

    getLandingPads(): LandingPad[] {
        return this.landingBays.flatMap((landingBay) => {
            return landingBay.landingPads;
        });
    }

    handleLandingRequest(request: LandingRequest): LandingPad | null {
        const availableLandingPads = this.getLandingPads()
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

    getOrbitProperties(): Orbit {
        return this.model.orbit;
    }

    getPhysicalProperties(): OrbitalObjectPhysicalProperties {
        return this.model.physicalProperties;
    }

    public getBoundingRadius(): number {
        return this.boundingRadius;
    }

    getTypeName(): string {
        return orbitalObjectTypeToDisplay(this.model);
    }

    public computeCulling(cameras: Camera[]): void {
        let isVisible = false;
        for (const camera of cameras) {
            isVisible = isVisible || isSizeOnScreenEnough(this, camera);
        }

        this.getTransform().setEnabled(isVisible);
    }

    private generate() {
        const solarPanelSurface = this.model.solarPanelSurfaceM2;
        const habitatSurface = this.model.totalHabitatSurfaceM2;

        const engineBay = new EngineBay(this.scene);
        engineBay.getTransform().parent = this.getTransform();
        let lastNode = engineBay.getTransform();
        this.engineBays.push(engineBay);

        const rng = getRngFromSeed(this.model.seed);

        lastNode = this.addUtilitySections(lastNode, 5 + Math.floor(rng(564) * 5), rng);

        const solarSection = new SolarSection(solarPanelSurface, Settings.SEED_HALF_RANGE * rng(31), this.scene);
        solarSection.getTransform().parent = this.getTransform();
        this.placeNode(solarSection.getTransform(), lastNode);
        lastNode = solarSection.getTransform();
        this.solarSections.push(solarSection);

        lastNode = this.addUtilitySections(lastNode, 5 + Math.floor(rng(23) * 5), rng);

        const habitatType = wheelOfFortune(
            [
                [SpaceStationNodeType.RING_HABITAT, 0.5],
                [SpaceStationNodeType.HELIX_HABITAT, 0.3],
                [SpaceStationNodeType.CYLINDER_HABITAT, 0.2]
            ],
            rng(17)
        );

        let newNode: TransformNode | null = null;
        if (habitatType === SpaceStationNodeType.HELIX_HABITAT) {
            const helixHabitat = new HelixHabitat(habitatSurface, Settings.SEED_HALF_RANGE * rng(19), this.scene);
            this.helixHabitats.push(helixHabitat);
            newNode = helixHabitat.getTransform();
        } else if (habitatType === SpaceStationNodeType.RING_HABITAT) {
            const ringHabitat = new RingHabitat(this.model, habitatSurface, Settings.SEED_HALF_RANGE * rng(27), this.scene);
            this.ringHabitats.push(ringHabitat);
            newNode = ringHabitat.getTransform();
        } else if (habitatType === SpaceStationNodeType.CYLINDER_HABITAT) {
            const cylinderHabitat = new CylinderHabitat(habitatSurface, Settings.SEED_HALF_RANGE * rng(13), this.scene);
            this.cylinderHabitats.push(cylinderHabitat);
            newNode = cylinderHabitat.getTransform();
        }

        if (newNode === null) {
            throw new Error("Node creation failed");
        }

        this.placeNode(newNode, lastNode);
        newNode.parent = this.root;
        lastNode = newNode;

        lastNode = this.addUtilitySections(lastNode, 5 + Math.floor(rng(23) * 5), rng);

        const landingBay = new LandingBay(this.model, rng(37) * Settings.SEED_HALF_RANGE, this.scene);

        this.landingBays.push(landingBay);
        this.placeNode(landingBay.getTransform(), lastNode);
        landingBay.getTransform().parent = this.getTransform();
    }

    private addUtilitySections(lastNode: TransformNode, nbSections: number, rng: (index: number) => number): TransformNode {
        let newLastNode = lastNode;
        for (let i = 0; i < nbSections; i++) {
            const utilitySection = new UtilitySection(rng(132 + 10 * this.utilitySections.length) * Settings.SEED_HALF_RANGE, this.scene);
            this.utilitySections.push(utilitySection);

            this.placeNode(utilitySection.getTransform(), newLastNode);

            utilitySection.getTransform().parent = this.getTransform();

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
        this.solarSections.forEach((solarSection) => solarSection.dispose());
        this.utilitySections.forEach((utilitySection) => utilitySection.dispose());
        this.helixHabitats.forEach((helixHabitat) => helixHabitat.dispose());
        this.ringHabitats.forEach((ringHabitat) => ringHabitat.dispose());
        this.cylinderHabitats.forEach((cylinderHabitat) => cylinderHabitat.dispose());
        this.landingBays.forEach((landingBay) => landingBay.dispose());
        this.engineBays.forEach((engineBay) => engineBay.dispose());

        this.root.dispose();
    }
}
