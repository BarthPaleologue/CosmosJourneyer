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
import { Quaternion, type Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import { type Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { type Scene } from "@babylonjs/core/scene";

import { type StellarObjectModel } from "@/backend/universe/orbitalObjects/index";
import { type SpaceElevatorModel } from "@/backend/universe/orbitalObjects/orbitalFacilities/spaceElevatorModel";

import { SpaceElevatorClimber } from "@/frontend/assets/procedural/spaceStation/climber/spaceElevatorClimber";
import { CylinderHabitat } from "@/frontend/assets/procedural/spaceStation/habitats/cylinder/cylinderHabitat";
import { HelixHabitat } from "@/frontend/assets/procedural/spaceStation/habitats/helix/helixHabitat";
import { RingHabitat } from "@/frontend/assets/procedural/spaceStation/habitats/ring/ringHabitat";
import { LandingBay } from "@/frontend/assets/procedural/spaceStation/landingBay/landingBay";
import { MetalSectionMaterial } from "@/frontend/assets/procedural/spaceStation/metalSectionMaterial";
import { SolarSection } from "@/frontend/assets/procedural/spaceStation/solarSection";
import { TokamakSection } from "@/frontend/assets/procedural/spaceStation/tokamakSection";
import { UtilitySection } from "@/frontend/assets/procedural/spaceStation/utilitySection";
import { type RenderingAssets } from "@/frontend/assets/renderingAssets";
import { isSizeOnScreenEnough } from "@/frontend/helpers/isObjectVisibleOnScreen";
import { getOrbitalObjectTypeToI18nString } from "@/frontend/helpers/orbitalObjectTypeToDisplay";
import { setUpVector } from "@/frontend/helpers/transform";
import { ObjectTargetCursorType, type Targetable, type TargetInfo } from "@/frontend/universe/architecture/targetable";
import { type Transformable } from "@/frontend/universe/architecture/transformable";
import { LandingPadManager, type ILandingPad } from "@/frontend/universe/orbitalFacility/landingPadManager";

import { getEdibleEnergyPerHaPerDay } from "@/utils/agriculture";
import { getRngFromSeed } from "@/utils/getRngFromSeed";
import { clamp, remap, triangleWave } from "@/utils/math";
import { getSphereIrradianceAtDistance } from "@/utils/physics/thermodynamics";
import { km2ToM2 } from "@/utils/physics/unitConversions";
import { wheelOfFortune } from "@/utils/random";
import { getSolarPanelSurfaceFromEnergyRequirement } from "@/utils/solarPanels";
import { type DeepReadonly } from "@/utils/types";

import { Settings } from "@/settings";

import { type OrbitalFacilityBase } from "./orbitalFacility";
import type { StationSection } from "./stationSection";

export class SpaceElevator implements OrbitalFacilityBase<"spaceElevator"> {
    readonly name: string;

    readonly model: DeepReadonly<SpaceElevatorModel>;

    readonly type = "spaceElevator";

    private readonly sections: Array<StationSection> = [];
    private readonly landingBays: Array<LandingBay> = [];

    private readonly tether: Mesh;
    private readonly tetherLength: number;
    private readonly tetherMaterial: MetalSectionMaterial;

    private readonly climber: SpaceElevatorClimber;

    private readonly root: TransformNode;

    private readonly scene: Scene;

    private readonly boundingRadius: number;

    private elapsedSeconds = 0;

    readonly targetInfo: TargetInfo;

    private readonly landingPadManager: LandingPadManager;

    private readonly lightContainer: ClusteredLightContainer;

    constructor(
        model: DeepReadonly<SpaceElevatorModel>,
        stellarObjects: ReadonlyMap<DeepReadonly<StellarObjectModel>, number>,
        assets: RenderingAssets,
        scene: Scene,
    ) {
        this.model = model;

        this.name = this.model.name;

        this.root = new TransformNode(this.name, scene);
        this.root.rotationQuaternion = Quaternion.Identity();

        this.scene = scene;

        const tetherThickness = 10;
        this.tetherLength = this.model.tetherLength;

        this.tether = MeshBuilder.CreateCylinder(
            `${this.name} Tether`,
            {
                height: this.tetherLength,
                diameter: tetherThickness,
                tessellation: 6,
            },
            this.scene,
        );
        this.tether.convertToFlatShadedMesh();

        this.tetherMaterial = new MetalSectionMaterial("TetherMaterial", assets.textures.materials.metalPanels, scene);
        this.tether.material = this.tetherMaterial;

        this.climber = new SpaceElevatorClimber(
            assets.materials.solarPanel,
            assets.textures.materials.crate,
            assets.textures.materials.metalPanels,
            scene,
        );
        this.climber.getTransform().parent = this.tether;

        this.climber.getTransform().position.y = this.tetherLength / 2;

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

        this.tether.parent = this.getTransform();

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

        this.lightContainer = new ClusteredLightContainer("SpaceElevatorLightContainer", this.getLights(), scene);
    }

    getLights(): Array<Light> {
        return this.sections.flatMap((section) => section.getLights());
    }

    getLandingPadManager(): LandingPadManager {
        return this.landingPadManager;
    }

    getSubTargets(): ReadonlyArray<Targetable> {
        return [this.climber, ...this.getLandingPadManager().getLandingPads()];
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

        const totalEnergyRequirementKWh = this.model.population * this.model.energyConsumptionPerCapitaKWh;
        const solarPanelSurfaceM2 = getSolarPanelSurfaceFromEnergyRequirement(
            this.model.solarPanelEfficiency,
            totalEnergyRequirementKWh,
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

        let lastNode: TransformNode = this.tether;

        const rng = getRngFromSeed(this.model.seed);

        lastNode = this.addUtilitySections(lastNode, 5 + Math.floor(rng(564) * 5), rng, assets);

        const habitatType = wheelOfFortune(
            [
                ["ring", 0.5],
                ["helix", 0.3],
                ["cylinder", 0.2],
            ] as const,
            rng(17),
        );

        let newSection: StationSection;
        switch (habitatType) {
            case "helix":
                newSection = new HelixHabitat(
                    totalHabitatSurfaceM2,
                    Settings.SEED_HALF_RANGE * rng(19),
                    assets.textures,
                    this.scene,
                );
                break;
            case "ring":
                newSection = new RingHabitat(
                    totalHabitatSurfaceM2,
                    Settings.SEED_HALF_RANGE * rng(27),
                    assets.textures,
                    this.scene,
                );
                break;
            case "cylinder":
                newSection = new CylinderHabitat(
                    totalHabitatSurfaceM2,
                    Settings.SEED_HALF_RANGE * rng(13),
                    assets.textures,
                    this.scene,
                );
                break;
        }

        this.sections.push(newSection);
        const newNode = newSection.getTransform();

        this.placeNode(newNode, lastNode);
        newNode.parent = this.root;
        lastNode = newNode;

        lastNode = this.addUtilitySections(lastNode, 5 + Math.floor(rng(23) * 5), rng, assets);

        const maxSolarPanelSurfaceM2 = km2ToM2(10);
        if (solarPanelSurfaceM2 <= maxSolarPanelSurfaceM2) {
            const solarSection = new SolarSection(
                solarPanelSurfaceM2 / 36, //TODO: remove 1/36 factor when going 1:1 scale
                Settings.SEED_HALF_RANGE * rng(31),
                assets,
                this.scene,
            );
            solarSection.getTransform().parent = this.getTransform();
            this.placeNode(solarSection.getTransform(), lastNode);
            lastNode = solarSection.getTransform();
            this.sections.push(solarSection);
        } else {
            // using solar panels is unfeasible, fall back on nuclear fusion
            const tokamakSection = new TokamakSection(totalEnergyRequirementKWh, assets, this.scene);
            this.placeNode(tokamakSection.getTransform(), lastNode);
            tokamakSection.getTransform().parent = this.getTransform();
            lastNode = tokamakSection.getTransform();
            this.sections.push(tokamakSection);
        }

        lastNode = this.addUtilitySections(lastNode, 5 + Math.floor(rng(23) * 5), rng, assets);

        const landingBay = new LandingBay(this.model, rng(37) * Settings.SEED_HALF_RANGE, assets, this.scene);

        this.landingBays.push(landingBay);
        this.sections.push(landingBay);
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
                rng(132 + 10 * this.sections.length) * Settings.SEED_HALF_RANGE,
                assets,
                this.scene,
            );
            this.sections.push(utilitySection);

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

    update(parents: ReadonlyArray<Transformable>, cameraWorldPosition: Vector3, deltaSeconds: number) {
        const parent = parents[0];
        if (parent === undefined) {
            throw new Error("Space Elevator should have exactly one parent");
        }

        const upDirection = this.getTransform().position.subtract(parent.getTransform().position).normalize();
        setUpVector(this.getTransform(), upDirection);

        this.elapsedSeconds += deltaSeconds;

        for (const section of this.sections) {
            section.update(cameraWorldPosition, deltaSeconds);
        }

        const climberSpeed = 300 / 3.6; // 300 km/h in m/s
        const roundTripDuration = (2 * this.tetherLength) / climberSpeed;

        this.climber.getTransform().position.y = remap(
            clamp(1.05 * triangleWave(this.elapsedSeconds / roundTripDuration), 0, 1),
            0,
            1,
            -this.tetherLength / 2,
            this.tetherLength / 2,
        );
    }

    getTransform(): TransformNode {
        return this.root;
    }

    dispose() {
        for (const section of this.sections) {
            section.dispose();
        }

        this.tether.dispose();
        this.tetherMaterial.dispose();

        this.climber.dispose();

        this.root.dispose();

        this.lightContainer.dispose();
    }
}
