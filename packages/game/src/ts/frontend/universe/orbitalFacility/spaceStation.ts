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

import { type Camera } from "@babylonjs/core/Cameras/camera";
import { ClusteredLightContainer } from "@babylonjs/core/Lights/Clustered/clusteredLightContainer";
import type { Light } from "@babylonjs/core/Lights/light";
import { Axis, Space } from "@babylonjs/core/Maths/math.axis";
import { Quaternion, type Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import { type Scene } from "@babylonjs/core/scene";

import { type StellarObjectModel } from "@/backend/universe/orbitalObjects/index";
import { type SpaceStationModel } from "@/backend/universe/orbitalObjects/orbitalFacilities/spacestationModel";

import { EngineBay } from "@/frontend/assets/procedural/spaceStation/engineBay";
import { CylinderHabitat } from "@/frontend/assets/procedural/spaceStation/habitats/cylinder/cylinderHabitat";
import { HelixHabitat } from "@/frontend/assets/procedural/spaceStation/habitats/helix/helixHabitat";
import { RingHabitat } from "@/frontend/assets/procedural/spaceStation/habitats/ring/ringHabitat";
import { LandingBay } from "@/frontend/assets/procedural/spaceStation/landingBay/landingBay";
import { SolarSection } from "@/frontend/assets/procedural/spaceStation/solarSection";
import { SpaceStationNodeType } from "@/frontend/assets/procedural/spaceStation/spaceStationNode";
import { UtilitySection } from "@/frontend/assets/procedural/spaceStation/utilitySection";
import { type RenderingAssets } from "@/frontend/assets/renderingAssets";
import { isSizeOnScreenEnough } from "@/frontend/helpers/isObjectVisibleOnScreen";
import { getOrbitalObjectTypeToI18nString } from "@/frontend/helpers/orbitalObjectTypeToDisplay";
import { ObjectTargetCursorType, type Targetable, type TargetInfo } from "@/frontend/universe/architecture/targetable";
import { type Transformable } from "@/frontend/universe/architecture/transformable";
import { LandingPadManager, type ILandingPad } from "@/frontend/universe/orbitalFacility/landingPadManager";

import { getEdibleEnergyPerHaPerDay } from "@/utils/agriculture";
import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { getSphereIrradianceAtDistance } from "@/utils/physics/thermodynamics";
import { wheelOfFortune } from "@/utils/random";
import { getSolarPanelSurfaceFromEnergyRequirement } from "@/utils/solarPanels";
import { type DeepReadonly } from "@/utils/types";

import { Settings } from "@/settings";

import { type OrbitalFacilityBase } from "./orbitalFacility";

export class SpaceStation implements OrbitalFacilityBase<"spaceStation"> {
    readonly name: string;

    readonly model: DeepReadonly<SpaceStationModel>;

    readonly type = "spaceStation";

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

    readonly targetInfo: TargetInfo;

    private readonly landingPadManager: LandingPadManager;

    private readonly lightContainer: ClusteredLightContainer;

    constructor(
        model: DeepReadonly<SpaceStationModel>,
        stellarObjects: ReadonlyMap<DeepReadonly<StellarObjectModel>, number>,
        assets: RenderingAssets,
        scene: Scene,
    ) {
        this.model = model;

        this.name = this.model.name;

        this.root = new TransformNode(this.name, scene);
        this.root.rotationQuaternion = Quaternion.Identity();

        this.scene = scene;

        // Generate the station first so we can access the landing pads
        this.generate(stellarObjects, assets);

        // Now that landing bays are generated, create the landing pad manager with all pads
        const allLandingPads: Array<ILandingPad> = [];
        const landingPadToLandingBay: Map<ILandingPad, { bay: LandingBay; index: number }> = new Map();
        for (const bay of this.landingBays) {
            for (const [landingPadIndex, landingPad] of bay.landingPads.entries()) {
                allLandingPads.push(landingPad);
                landingPadToLandingBay.set(landingPad, { bay, index: landingPadIndex });
            }
        }
        this.landingPadManager = new LandingPadManager(allLandingPads);
        this.landingPadManager.onStatusChanged.add(({ pad, status }) => {
            const padInfo = landingPadToLandingBay.get(pad);
            if (padInfo === undefined) {
                console.warn("Landing pad not found in landing bay map");
                return;
            }

            padInfo.bay.setLandingPadStatus(padInfo.index, status);
        });

        // center the space station on its center of mass
        const boundingVectors = this.getTransform().getHierarchyBoundingVectors();
        const centerWorld = boundingVectors.max.add(boundingVectors.min).scale(0.5);
        const deltaPosition = this.getTransform().getAbsolutePosition().subtract(centerWorld);

        this.getTransform()
            .getChildTransformNodes(true)
            .forEach((transform) => transform.position.addInPlace(deltaPosition));

        const extendSize = boundingVectors.max.subtract(boundingVectors.min).scale(0.5);
        this.boundingRadius = Math.max(extendSize.x, extendSize.y, extendSize.z);

        this.targetInfo = {
            type: ObjectTargetCursorType.FACILITY,
            minDistance: this.getBoundingRadius() * 6.0,
            maxDistance: 0.0,
        };

        this.lightContainer = new ClusteredLightContainer(`${this.name}_lightContainer`, this.getLights(), scene);
    }

    getLights(): Array<Light> {
        const result: Array<Light> = [];
        result.push(...this.landingBays.flatMap((landingBay) => landingBay.getLights()));
        result.push(...this.utilitySections.flatMap((utilitySection) => utilitySection.getLights()));
        result.push(...this.cylinderHabitats.flatMap((cylinderHabitat) => cylinderHabitat.getLights()));
        result.push(...this.ringHabitats.flatMap((ringHabitat) => ringHabitat.getLights()));
        result.push(...this.helixHabitats.flatMap((helixHabitat) => helixHabitat.getLights()));
        result.push(...this.solarSections.flatMap((solarSection) => solarSection.getLights()));
        return result;
    }

    getLandingPadManager(): LandingPadManager {
        return this.landingPadManager;
    }

    getSubTargets(): ReadonlyArray<Targetable> {
        return this.getLandingPadManager().getLandingPads();
    }

    public getBoundingRadius(): number {
        return this.boundingRadius;
    }

    getTypeName(): string {
        return getOrbitalObjectTypeToI18nString(this.model);
    }

    public computeCulling(camera: Camera): void {
        this.getTransform().setEnabled(isSizeOnScreenEnough(this, camera));
    }

    private generate(stellarObjects: ReadonlyMap<DeepReadonly<StellarObjectModel>, number>, assets: RenderingAssets) {
        let totalStellarFlux = 0;
        stellarObjects.forEach((distance, model) => {
            totalStellarFlux += getSphereIrradianceAtDistance(model.blackBodyTemperature, model.radius, distance);
        });

        const solarPanelSurfaceM2 = getSolarPanelSurfaceFromEnergyRequirement(
            this.model.solarPanelEfficiency,
            this.model.population * this.model.energyConsumptionPerCapitaKWh,
            totalStellarFlux,
        );

        const housingSurfaceHa = (100 * this.model.population) / this.model.populationDensity; // convert km² to ha
        let agricultureSurfaceHa = 0;
        this.model.agricultureMix.forEach(([fraction, cropType]) => {
            const requiredDailyKCal = this.model.population * Settings.INDIVIDUAL_AVERAGE_DAILY_INTAKE;

            const KCalPerHa =
                Settings.HYDROPONIC_TO_CONVENTIONAL_RATIO *
                this.model.nbHydroponicLayers *
                getEdibleEnergyPerHaPerDay(cropType);

            agricultureSurfaceHa += (fraction * requiredDailyKCal) / KCalPerHa;
        });
        const totalHabitatSurfaceM2 = (housingSurfaceHa + agricultureSurfaceHa) * 1000; // convert ha to m²

        const engineBay = new EngineBay(assets, this.scene);
        engineBay.getTransform().parent = this.getTransform();
        let lastNode = engineBay.getTransform();
        this.engineBays.push(engineBay);

        const rng = getRngFromSeed(this.model.seed);

        lastNode = this.addUtilitySections(lastNode, 5 + Math.floor(rng(564) * 5), rng, assets);

        const solarSection = new SolarSection(
            solarPanelSurfaceM2,
            Settings.SEED_HALF_RANGE * rng(31),
            assets,
            this.scene,
        );
        solarSection.getTransform().parent = this.getTransform();
        this.placeNode(solarSection.getTransform(), lastNode);
        lastNode = solarSection.getTransform();
        this.solarSections.push(solarSection);

        lastNode = this.addUtilitySections(lastNode, 5 + Math.floor(rng(23) * 5), rng, assets);

        const habitatType = wheelOfFortune(
            [
                [SpaceStationNodeType.RING_HABITAT, 1 / 3],
                [SpaceStationNodeType.HELIX_HABITAT, 1 / 3],
                [SpaceStationNodeType.CYLINDER_HABITAT, 1 / 3],
            ],
            rng(17),
        );

        let newNode: TransformNode | null = null;
        if (habitatType === SpaceStationNodeType.HELIX_HABITAT) {
            const helixHabitat = new HelixHabitat(
                totalHabitatSurfaceM2,
                Settings.SEED_HALF_RANGE * rng(19),
                assets.textures,
                this.scene,
            );
            this.helixHabitats.push(helixHabitat);
            newNode = helixHabitat.getTransform();
        } else if (habitatType === SpaceStationNodeType.RING_HABITAT) {
            const ringHabitat = new RingHabitat(
                totalHabitatSurfaceM2,
                Settings.SEED_HALF_RANGE * rng(27),
                assets.textures,
                this.scene,
            );
            this.ringHabitats.push(ringHabitat);
            newNode = ringHabitat.getTransform();
        } else if (habitatType === SpaceStationNodeType.CYLINDER_HABITAT) {
            const cylinderHabitat = new CylinderHabitat(
                totalHabitatSurfaceM2,
                Settings.SEED_HALF_RANGE * rng(13),
                assets.textures,
                this.scene,
            );
            this.cylinderHabitats.push(cylinderHabitat);
            newNode = cylinderHabitat.getTransform();
        }

        if (newNode === null) {
            throw new Error("Node creation failed");
        }

        this.placeNode(newNode, lastNode);
        newNode.parent = this.root;
        lastNode = newNode;

        lastNode = this.addUtilitySections(lastNode, 5 + Math.floor(rng(23) * 5), rng, assets);

        const landingBay = new LandingBay(this.model, rng(37) * Settings.SEED_HALF_RANGE, assets, this.scene);

        this.landingBays.push(landingBay);
        this.placeNode(landingBay.getTransform(), lastNode);
        landingBay.getTransform().parent = this.getTransform();
    }

    private addUtilitySections(
        lastNode: TransformNode,
        nbSections: number,
        rng: (index: number) => number,
        assets: RenderingAssets,
    ): TransformNode {
        let newLastNode = lastNode;
        for (let i = 0; i < nbSections; i++) {
            const utilitySection = new UtilitySection(
                rng(132 + 10 * this.utilitySections.length) * Settings.SEED_HALF_RANGE,
                assets,
                this.scene,
            );
            this.utilitySections.push(utilitySection);

            this.placeNode(utilitySection.getTransform(), newLastNode);

            utilitySection.getTransform().parent = this.getTransform();

            newLastNode = utilitySection.getTransform();
        }

        return newLastNode;
    }

    private placeNode(node: TransformNode, parent: TransformNode) {
        // Make sure bounds are current
        parent.computeWorldMatrix(true);
        node.computeWorldMatrix(true);

        const parentBV = parent.getHierarchyBoundingVectors();
        const nodeBV = node.getHierarchyBoundingVectors();

        const deltaY = parentBV.max.y - nodeBV.min.y; // bring node bottom to parent top

        node.translate(Axis.Y, deltaY, Space.WORLD);
    }

    update(parents: ReadonlyArray<Transformable>, cameraWorldPosition: Vector3, deltaSeconds: number) {
        this.solarSections.forEach((solarSection) => {
            solarSection.update(cameraWorldPosition);
        });
        this.utilitySections.forEach((utilitySection) => {
            utilitySection.update(cameraWorldPosition);
        });
        this.helixHabitats.forEach((helixHabitat) => {
            helixHabitat.update(cameraWorldPosition, deltaSeconds);
        });
        this.ringHabitats.forEach((ringHabitat) => {
            ringHabitat.update(cameraWorldPosition, deltaSeconds);
        });
        this.cylinderHabitats.forEach((cylinderHabitat) => {
            cylinderHabitat.update(cameraWorldPosition, deltaSeconds);
        });
        this.landingBays.forEach((landingBay) => {
            landingBay.update(cameraWorldPosition, deltaSeconds);
        });
        this.engineBays.forEach((engineBay) => {
            engineBay.update(cameraWorldPosition);
        });
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        this.solarSections.forEach((solarSection) => {
            solarSection.dispose();
        });
        this.utilitySections.forEach((utilitySection) => {
            utilitySection.dispose();
        });
        this.helixHabitats.forEach((helixHabitat) => {
            helixHabitat.dispose();
        });
        this.ringHabitats.forEach((ringHabitat) => {
            ringHabitat.dispose();
        });
        this.cylinderHabitats.forEach((cylinderHabitat) => {
            cylinderHabitat.dispose();
        });
        this.landingBays.forEach((landingBay) => {
            landingBay.dispose();
        });
        this.engineBays.forEach((engineBay) => {
            engineBay.dispose();
        });

        this.lightContainer.dispose();

        this.root.dispose();
    }
}
